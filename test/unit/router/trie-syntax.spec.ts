import { describe, expect, it } from 'vitest';
import {
    App,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { RouteEntry } from '../../../src/app/types';
import { createTestRequest } from '../../helpers';

/**
 * Phase 2 — TrieRouter owns its syntax surface end-to-end. The
 * trie's own parser handles the routup vocabulary (static, `:name`,
 * `:name?`, `{...}`, `*`, `*name`); param extraction comes from a
 * pre-built `paramsIndexMap` walked against the request's segments
 * (no `matcher.exec` per match, no path-to-regexp dependency).
 *
 * Paths the trie parser doesn't handle (regex constraints, compound
 * segments like `/files/:n.ext`, escape sequences) fall back to the
 * universal bucket which still uses path-to-regexp — covered by
 * `compliance.spec.ts` against both routers.
 */
describe('TrieRouter — Phase 2 syntax', () => {
    function app() {
        return new App({ router: new TrieRouter<RouteEntry>() });
    }

    describe('T2 — optional params (`:name?`)', () => {
        it('matches with and without the optional param', async () => {
            const a = app();
            a.get('/users/:id?', defineCoreHandler((event) => `id=${event.params.id ?? 'none'}`));

            expect(await (await a.fetch(createTestRequest('/users'))).text()).toBe('id=none');
            expect(await (await a.fetch(createTestRequest('/users/42'))).text()).toBe('id=42');
        });
    });

    describe('T2 — optional groups (`{/segment}`)', () => {
        it('matches with and without the group', async () => {
            const a = app();
            a.get('/users{/edit}', defineCoreHandler(() => 'matched'));

            expect((await a.fetch(createTestRequest('/users'))).status).toBe(200);
            expect((await a.fetch(createTestRequest('/users/edit'))).status).toBe(200);
            expect((await a.fetch(createTestRequest('/users/other'))).status).toBe(404);
        });

        it('expands param inside group', async () => {
            const a = app();
            a.get('/users{/:id}', defineCoreHandler((event) => `id=${event.params.id ?? 'none'}`));

            expect(await (await a.fetch(createTestRequest('/users'))).text()).toBe('id=none');
            expect(await (await a.fetch(createTestRequest('/users/42'))).text()).toBe('id=42');
        });
    });

    describe('T3 — ParamsIndexMap-style extraction', () => {
        it('extracts a single param', async () => {
            const a = app();
            a.get('/users/:id', defineCoreHandler((event) => String(event.params.id)));

            expect(await (await a.fetch(createTestRequest('/users/42'))).text()).toBe('42');
        });

        it('extracts multiple params', async () => {
            const a = app();
            a.get(
                '/orgs/:org/repos/:repo',
                defineCoreHandler((event) => `${event.params.org}:${event.params.repo}`),
            );

            expect(await (await a.fetch(createTestRequest('/orgs/acme/repos/widgets'))).text())
                .toBe('acme:widgets');
        });

        it('captures named splat as the joined remainder', async () => {
            const a = app();
            a.get('/static/*file', defineCoreHandler((event) => String(event.params.file)));

            expect(await (await a.fetch(createTestRequest('/static/css/main.css'))).text())
                .toBe('css/main.css');
        });

        it('captures bare splat as `*`', async () => {
            const a = app();
            a.get('/proxy/*', defineCoreHandler((event) => String(event.params['*'])));

            expect(await (await a.fetch(createTestRequest('/proxy/api/users'))).text())
                .toBe('api/users');
        });

        it('decodes URL-encoded param values', async () => {
            const a = app();
            a.get('/users/:name', defineCoreHandler((event) => String(event.params.name)));

            // %20 → space
            const res = await a.fetch(createTestRequest('/users/john%20doe'));
            expect(await res.text()).toBe('john doe');
        });

        it('returns the matched prefix as `event.mountPath` for nested apps', async () => {
            const inner = new App({ router: new TrieRouter<RouteEntry>() });
            inner.get('/items', defineCoreHandler((event) => event.mountPath));

            const outer = new App({ router: new TrieRouter<RouteEntry>() });
            outer.use('/api/:version', inner);

            // The trie computes `match.path` = `/api/v1` from the request
            // segments and the variant's matchDepth (no matcher.exec).
            // App's dispatch then strips that prefix when descending.
            const res = await outer.fetch(createTestRequest('/api/v1/items'));
            expect(await res.text()).toBe('/api/v1');
        });
    });

    describe('audit — review-round 2', () => {
        it('expanded prefix variants prefer the most specific match (greatest matchDepth)', async () => {
            // `use('/api/:version?', child)` expands to `/api` and
            // `/api/:version`. For request `/api/v1`, both match
            // structurally — the dedup must keep the *longer* one
            // so `params.version === 'v1'` and `event.mountPath ===
            // '/api/v1'`. Picking the shorter variant blindly would
            // lose params.
            const inner = new App({ router: new TrieRouter<RouteEntry>() });
            inner.get('/', defineCoreHandler((event) => `version=${event.params.version ?? 'none'}`));

            const outer = new App({ router: new TrieRouter<RouteEntry>() });
            outer.use('/api/:version?', inner);

            expect(await (await outer.fetch(createTestRequest('/api/v1'))).text())
                .toBe('version=v1');
            expect(await (await outer.fetch(createTestRequest('/api'))).text())
                .toBe('version=none');
        });

        it('rejects literal text following a `}` group close (compound — universal bucket)', async () => {
            // `/a{/b}c` is compound syntax (literal `c` adjacent to
            // an optional group). The trie parser can't represent
            // it cleanly; without the post-`}` validation it
            // silently rewrote into `/a/c` + `/a/b/c`, which is
            // wrong. Falling to the universal bucket lets path-to-
            // regexp speak with authority.
            const a = app();
            a.get('/a{/b}c', defineCoreHandler(() => 'matched'));

            // path-to-regexp v8 interprets `/a{/b}c` as `/a/c` or
            // `/a/b/c` (the literal `c` is consumed by the group's
            // tail). The trie should NOT promiscuously match
            // anything else — `/a/x` must 404.
            expect((await a.fetch(createTestRequest('/a/x'))).status).toBe(404);
        });

        it('falls back to universal bucket above MAX_VARIANTS', async () => {
            // 5 optional groups → 32 variants, exceeds the parser's
            // cap of 16. The route should still register and dispatch
            // correctly via the universal-bucket fallback.
            const a = app();
            a.get('/a{/b}{/c}{/d}{/e}{/f}', defineCoreHandler(() => 'capped'));

            expect((await a.fetch(createTestRequest('/a'))).status).toBe(200);
            expect((await a.fetch(createTestRequest('/a/b/c/d/e/f'))).status).toBe(200);
        });

        it('falls back to the raw segment value on malformed URL encoding', async () => {
            // `decodeURIComponent('%2')` throws `URIError`. The
            // try/catch in `decodeOrRaw` returns the raw segment so
            // the route still matches without crashing.
            const a = app();
            a.get('/users/:name', defineCoreHandler((event) => String(event.params.name)));

            const res = await a.fetch(createTestRequest('/users/bad%2'));
            expect(res.status).toBe(200);
            expect(await res.text()).toBe('bad%2');
        });
    });

    describe('audit — regressions caught during review', () => {
        it('splat-not-last falls through to universal (does not silently drop trailing segments)', async () => {
            // `/files/*rest/extra` requires `/extra` after the splat-
            // captured segments. The trie's `insertIntoTrie` would
            // happily push the route into `splatRoutes` at depth 1
            // and silently drop `/extra`. After Phase 2 dropped the
            // `matcher.exec` confirm pass, the only safety net is
            // making the parser refuse such paths so they fall back
            // to path-to-regexp via the universal bucket.
            const a = app();
            a.get('/files/*rest/extra', defineCoreHandler(() => 'matched'));

            // Without `/extra` → 404 (path-to-regexp template
            // requires the trailing literal).
            expect((await a.fetch(createTestRequest('/files/abc'))).status).toBe(404);
            // With `/extra` → matches.
            expect((await a.fetch(createTestRequest('/files/abc/extra'))).status).toBe(200);
        });

        it('exact-match handler at "/" does not match every path', async () => {
            // `app.get('/', h)` is exact — it must reject `/users`
            // and friends. Bypassing the trie at registration and
            // omitting the matcher would silently make this handler
            // serve every request.
            const a = app();
            a.get('/', defineCoreHandler(() => 'root'));

            expect((await a.fetch(createTestRequest('/'))).status).toBe(200);
            expect((await a.fetch(createTestRequest('/users'))).status).toBe(404);
            expect((await a.fetch(createTestRequest('/foo/bar'))).status).toBe(404);
        });

        it('splat-terminated mounted app sees full request via mountPath', async () => {
            // `app.use('/files/*rest', child)` matches every path
            // under `/files`. `match.path` (used by the dispatcher
            // to strip mount prefix) must reflect the full matched
            // request — pre-Phase-2 this was the path-to-regexp
            // `output.path` (the entire matched portion); post-
            // Phase-2 the trie should compute the same.
            const inner = new App({ router: new TrieRouter<RouteEntry>() });
            inner.get('/', defineCoreHandler((event) => event.mountPath));

            const outer = new App({ router: new TrieRouter<RouteEntry>() });
            outer.use('/files/*rest', inner);

            const res = await outer.fetch(createTestRequest('/files/a/b/c'));
            expect(await res.text()).toBe('/files/a/b/c');
        });
    });

    describe('T6 — trie-native parser', () => {
        it('collapses trailing slash (parseRequestPath drops empty trailing segments)', async () => {
            const a = app();
            a.get('/users', defineCoreHandler(() => 'matched'));

            // `parseRequestPath` splits on `/` and drops empty
            // segments, so `/users` and `/users/` collapse to the
            // same `['users']` lookup. Trailing slashes are NOT
            // significant — both match. (LinearRouter shows the
            // same behaviour; documented divergence from path-to-
            // regexp's strict mode.)
            expect((await a.fetch(createTestRequest('/users'))).status).toBe(200);
            expect((await a.fetch(createTestRequest('/users/'))).status).toBe(200);
        });

        it('falls back to universal bucket on compound segments', async () => {
            // `/files/:name.ext` is a compound segment (param +
            // literal in the same path segment) — path-to-regexp v8
            // supports it but the trie's own parser doesn't. The
            // route must still work via the universal-bucket
            // fallback.
            const a = app();
            a.get('/files/:name.ext', defineCoreHandler((event) => String(event.params.name)));

            expect(await (await a.fetch(createTestRequest('/files/report.ext'))).text())
                .toBe('report');
            // Wrong literal suffix → no match (proves the universal
            // matcher's path-to-regexp template applied).
            expect((await a.fetch(createTestRequest('/files/report.txt'))).status).toBe(404);
        });
    });
});
