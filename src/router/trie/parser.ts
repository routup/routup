import type { Segment } from './types.ts';

/**
 * Trie-native path parser.
 *
 * Replaces the call-out to `path-to-regexp` for the syntax surface
 * the trie advertises:
 *
 *   - Static segments: `users`, `v1`
 *   - Named params:    `:id`, `:slug`
 *   - Optional params: `:id?`            (T2 — expanded to two variants)
 *   - Optional groups: `{...}`           (T2 — expanded to two variants)
 *   - Bare splat:      `*`               (matches the rest of the path)
 *   - Named splat:     `*rest`
 *
 * Returns a list of `Segment[]` *variants* — one path string can
 * expand into multiple route variants when it contains optional
 * markers. The trie inserts every variant with the same registration
 * `index` so they dedupe naturally on the candidate list.
 *
 * Returns `null` when the path uses syntax outside this surface
 * (regex constraints `:name(\d+)`, compound segments `/files/:n.ext`,
 * escape sequences `\:`, …). The caller falls back to the universal
 * bucket so correctness is preserved via path-to-regexp.
 *
 * Variant cap: nested optional groups expand combinatorially. The
 * parser caps the variant count at `MAX_VARIANTS` and falls back to
 * the universal bucket above that — registration-time explosion
 * isn't worth the lookup-time win on degenerate paths.
 */

const MAX_VARIANTS = 16;

type ParamToken = {
    kind: 'param';
    name: string;
    optional: boolean;
};

type Token = { kind: 'literal'; value: string } |
    ParamToken |
    { kind: 'splat'; name: string } |
    { kind: 'groupOpen' } |
    { kind: 'groupClose' };

const PARAM_NAME = /^[a-zA-Z_]\w*/;

/**
 * Tokenize a single path segment (the substring between two `/`).
 * Returns `null` if the segment uses syntax we don't handle.
 *
 * Each segment must yield exactly one token — compound segments
 * (`/files/:n.ext`, `/users-:id`) produce multiple tokens and so
 * trip this check, falling back to the universal bucket.
 */
function tokenizeSegment(segment: string): Token | null {
    if (segment === '') {
        return null;
    }

    // Optional group: `{...}` — emit as group open/close markers
    // around the expansion of the inner segment. Currently the
    // inner is only tokenized as a single segment; nested slashes
    // inside a group fall back to the universal bucket.
    if (segment.charAt(0) === '{' && segment.charAt(segment.length - 1) === '}') {
        return null; // groups are slash-spanning — handled at the path level
    }

    if (segment === '*') {
        return { kind: 'splat', name: '*' };
    }

    if (segment.charAt(0) === '*') {
        const rest = segment.slice(1);
        if (PARAM_NAME.test(rest) && PARAM_NAME.exec(rest)![0] === rest) {
            return { kind: 'splat', name: rest };
        }
        return null;
    }

    if (segment.charAt(0) === ':') {
        const optional = segment.charAt(segment.length - 1) === '?';
        const nameRaw = optional ? segment.slice(1, -1) : segment.slice(1);
        if (PARAM_NAME.test(nameRaw) && PARAM_NAME.exec(nameRaw)![0] === nameRaw) {
            return {
                kind: 'param',
                name: nameRaw,
                optional,
            };
        }
        return null;
    }

    // Plain static segment — only allow URL-safe characters. A
    // segment with a `:` mid-string (compound) trips here too.
    if (/^[a-zA-Z0-9_\-.~%]+$/.test(segment)) {
        return { kind: 'literal', value: segment };
    }

    return null;
}

/**
 * Tokenize the full path into a token stream, recognizing slash-
 * spanning optional groups (`/users{/edit/:id}`).
 *
 * The group-open marker is emitted in place of the leading `/`
 * inside `{...}`; group-close before the trailing `}`. The walker
 * later expands by either keeping the run between markers or
 * dropping it.
 */
function tokenizePath(path: string): Token[] | null {
    const trimmed = path.charAt(0) === '/' ? path.slice(1) : path;
    if (trimmed === '') {
        return [];
    }

    const tokens: Token[] = [];
    let i = 0;
    const n = trimmed.length;

    while (i < n) {
        if (trimmed.charAt(i) === '{') {
            // Find matching `}` (no nesting support — fall back if
            // we see a nested `{` before the close).
            let close = -1;
            for (let j = i + 1; j < n; j++) {
                const c = trimmed.charAt(j);
                if (c === '{') {
                    return null;
                }
                if (c === '}') {
                    close = j;
                    break;
                }
            }
            if (close === -1) {
                return null;
            }
            const inner = trimmed.slice(i + 1, close);
            // Inner must start with `/` so the group is slash-spanning
            // (matches path-to-regexp v8's `{/segment}` shape).
            if (inner.charAt(0) !== '/') {
                return null;
            }
            tokens.push({ kind: 'groupOpen' });
            const innerTokens = tokenizePath(inner);
            if (innerTokens === null) {
                return null;
            }
            for (const t of innerTokens) {
                tokens.push(t);
            }
            tokens.push({ kind: 'groupClose' });
            i = close + 1;
            continue;
        }

        // Read until next `/` or `{`.
        let segEnd = i;
        while (segEnd < n) {
            const c = trimmed.charAt(segEnd);
            if (c === '/' || c === '{') {
                break;
            }
            segEnd++;
        }
        const segment = trimmed.slice(i, segEnd);
        if (segment !== '') {
            const token = tokenizeSegment(segment);
            if (token === null) {
                return null;
            }
            tokens.push(token);
        }
        i = segEnd;
        if (i < n && trimmed.charAt(i) === '/') {
            i++; // skip the separator
        }
    }

    return tokens;
}

/**
 * Expand the token stream into one or more concrete `Segment[]`
 * variants by:
 *   1. Splitting `groupOpen` … `groupClose` runs into a "with run"
 *      and a "without run" choice (one optional group → ×2 variants).
 *   2. Splitting `param.optional = true` into a "with" and "without"
 *      choice (one `:id?` → ×2 variants).
 *
 * Caps at `MAX_VARIANTS` — beyond that, returns `null` so the path
 * falls back to the universal bucket.
 */
function expand(tokens: Token[]): Segment[][] | null {
    let variants: Token[][] = [[]];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]!;

        if (token.kind === 'groupOpen') {
            // Find matching `groupClose`. Nested groups already
            // rejected at tokenize time so this is one level deep.
            let depth = 1;
            let close = -1;
            for (let j = i + 1; j < tokens.length; j++) {
                const t = tokens[j]!;
                if (t.kind === 'groupOpen') depth++;
                else if (t.kind === 'groupClose') {
                    depth--;
                    if (depth === 0) {
                        close = j;
                        break;
                    }
                }
            }
            if (close === -1) {
                return null;
            }
            const inner = tokens.slice(i + 1, close);
            const expanded = expand(inner);
            if (expanded === null) {
                return null;
            }
            // Two choices for this run: with each inner expansion, or without.
            const next: Token[][] = [];
            for (const v of variants) {
                // Without
                next.push(v.slice());
                // With each inner variant
                for (const innerVariant of expanded) {
                    const innerTokens: Token[] = innerVariant.map(toToken);
                    next.push(v.concat(innerTokens));
                }
                if (next.length > MAX_VARIANTS) {
                    return null;
                }
            }
            variants = next;
            i = close;
            continue;
        }

        if (token.kind === 'param' && token.optional) {
            const stripped: Token = {
                kind: 'param', 
                name: token.name, 
                optional: false, 
            };
            const next: Token[][] = [];
            for (const v of variants) {
                next.push(v.slice());                  // without the optional param
                next.push(v.concat([stripped]));       // with the param
                if (next.length > MAX_VARIANTS) {
                    return null;
                }
            }
            variants = next;
            continue;
        }

        for (const v of variants) {
            v.push(token);
        }
    }

    // Convert tokens → Segment[]. Group markers should all be
    // consumed by now; if any leak through it's a parser bug.
    const result: Segment[][] = [];
    for (const v of variants) {
        const segments: Segment[] = [];
        for (const t of v) {
            if (t.kind === 'groupOpen' || t.kind === 'groupClose') {
                return null;
            }
            if (t.kind === 'literal') {
                segments.push({ kind: 'static', value: t.value });
            } else if (t.kind === 'param') {
                segments.push({ kind: 'param', name: t.name });
            } else {
                segments.push({ kind: 'splat', name: t.name });
            }
        }
        result.push(segments);
    }
    return result;
}

/**
 * Bridge between Segment (post-expansion) and Token (in-flight). Used
 * when an optional group is expanded recursively — the inner Segment[]
 * needs to slot back in as Token[] for the outer expansion pass.
 */
function toToken(seg: Segment): Token {
    if (seg.kind === 'static') return { kind: 'literal', value: seg.value };
    if (seg.kind === 'param') {return {
        kind: 'param', 
        name: seg.name, 
        optional: false, 
    };}
    return { kind: 'splat', name: seg.name };
}

export function parsePath(path: string): Segment[][] | null {
    const tokens = tokenizePath(path);
    if (tokens === null) {
        return null;
    }
    return expand(tokens);
}
