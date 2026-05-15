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
 * (compound segments `/files/:n.ext`, escape sequences `\:`, regex
 * constraints, splat-not-last, …). The caller falls back to the
 * universal bucket so correctness is preserved via path-to-regexp.
 *
 * Variant cap: nested optional groups expand combinatorially. The
 * parser caps the variant count at `MAX_VARIANTS` and falls back to
 * the universal bucket above that — registration-time explosion
 * isn't worth the lookup-time win on degenerate paths.
 */

const MAX_VARIANTS = 16;

const PARAM_NAME = /^[a-zA-Z_]\w*$/;

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

    if (segment === '*') {
        return { kind: 'splat', name: '*' };
    }

    if (segment.charAt(0) === '*') {
        const rest = segment.slice(1);
        if (PARAM_NAME.test(rest)) {
            return { kind: 'splat', name: rest };
        }
        return null;
    }

    if (segment.charAt(0) === ':') {
        const optional = segment.charAt(segment.length - 1) === '?';
        const nameRaw = optional ? segment.slice(1, -1) : segment.slice(1);
        if (PARAM_NAME.test(nameRaw)) {
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
 * Expand the token stream into one or more concrete `Token[]`
 * variants by:
 *   1. Splitting `groupOpen` … `groupClose` runs into a "with run"
 *      and a "without run" choice (one optional group → ×2 variants).
 *   2. Splitting `param.optional = true` into a "with" and "without"
 *      choice (one `:id?` → ×2 variants).
 *
 * Caps at `MAX_VARIANTS` — beyond that, returns `null` so the path
 * falls back to the universal bucket.
 *
 * Returns `Token[][]` (not `Segment[][]`) so the recursive
 * group-expansion can splice inner variants back into the outer
 * token stream without a lossy round-trip through `Segment`.
 * `parsePath` does the final `Token → Segment` projection.
 */
function expand(tokens: Token[]): Token[][] | null {
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
            const expandedInner = expand(inner);
            if (expandedInner === null) {
                return null;
            }
            // Two choices for this run: keep without, or splice in
            // each inner variant. Cap-check before each push so
            // we never exceed `MAX_VARIANTS`.
            const next: Token[][] = [];
            for (const v of variants) {
                if (next.length >= MAX_VARIANTS) {
                    return null;
                }
                next.push(v.slice());
                for (const innerVariant of expandedInner) {
                    if (next.length >= MAX_VARIANTS) {
                        return null;
                    }
                    next.push(v.concat(innerVariant));
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
                if (next.length >= MAX_VARIANTS) {
                    return null;
                }
                next.push(v.slice());
                if (next.length >= MAX_VARIANTS) {
                    return null;
                }
                next.push(v.concat([stripped]));
            }
            variants = next;
            continue;
        }

        for (const v of variants) {
            v.push(token);
        }
    }

    return variants;
}

function tokenToSegment(t: Token): Segment | null {
    if (t.kind === 'literal') return { kind: 'static', value: t.value };
    if (t.kind === 'param') return { kind: 'param', name: t.name };
    if (t.kind === 'splat') return { kind: 'splat', name: t.name };
    // groupOpen/groupClose should be consumed by `expand`; if any
    // leak through, the path is malformed.
    return null;
}

/**
 * Stable, structural identity for a variant — used to drop duplicate
 * expansions like `/users{/:id?}` (which produces the bare-`/users`
 * variant twice: once from the "without group" branch and once from
 * the "with group, without optional param" branch).
 */
function variantKey(segs: Segment[]): string {
    let out = '';
    for (const s of segs) {
        if (s.kind === 'static') out += `/s:${s.value}`;
        else if (s.kind === 'param') out += `/p:${s.name}`;
        else out += `/*:${s.name}`;
    }
    return out;
}

export function parsePath(path: string): Segment[][] | null {
    const tokens = tokenizePath(path);
    if (tokens === null) {
        return null;
    }
    const variants = expand(tokens);
    if (variants === null) {
        return null;
    }

    const result: Segment[][] = [];
    const seen = new Set<string>();

    for (const v of variants) {
        const segs: Segment[] = [];
        for (const t of v) {
            const s = tokenToSegment(t);
            if (s === null) {
                return null;
            }
            segs.push(s);
        }

        // Splat must be the terminal segment in any variant —
        // otherwise the trie's `insertIntoTrie` would silently drop
        // every segment after the splat (T3 dropped the
        // `matcher.exec` confirm pass that previously caught this).
        // Fall back to the universal bucket so path-to-regexp can
        // handle the route honestly.
        for (let i = 0; i < segs.length - 1; i++) {
            if (segs[i]!.kind === 'splat') {
                return null;
            }
        }

        const key = variantKey(segs);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(segs);
    }
    return result;
}
