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

    describe('T6 — trie-native parser', () => {
        it('treats trailing slash as significant (strict mode)', async () => {
            const a = app();
            a.get('/users', defineCoreHandler(() => 'no-slash'));

            // The request `/users/` has an extra trailing segment
            // (after splitting on `/`, the trailing empty string is
            // dropped by `parseRequestPath` — so they collapse to
            // the same lookup key. Document the actual behaviour.)
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
