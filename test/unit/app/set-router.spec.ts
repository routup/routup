import { describe, expect, it } from 'vitest';
import {
    App,
    LinearRouter,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { Route, RouteEntry } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('App.setRouter', () => {
    it('replays previously-registered routes onto the new router', async () => {
        const app = new App();
        app.get('/users/:id', defineCoreHandler((event) => `id=${event.params.id}`));
        app.post('/users', defineCoreHandler(() => 'created'));

        // Swap from the default LinearRouter to a TrieRouter mid-flight.
        app.setRouter(new TrieRouter<RouteEntry>());

        const a = await app.fetch(createTestRequest('/users/42'));
        expect(await a.text()).toBe('id=42');

        const b = await app.fetch(createTestRequest('/users', { method: 'POST' }));
        expect(await b.text()).toBe('created');
    });

    it('routes registered after setRouter land on the new router', async () => {
        const app = new App();
        app.get('/before', defineCoreHandler(() => 'before'));

        app.setRouter(new TrieRouter<RouteEntry>());
        app.get('/after', defineCoreHandler(() => 'after'));

        expect(await (await app.fetch(createTestRequest('/before'))).text()).toBe('before');
        expect(await (await app.fetch(createTestRequest('/after'))).text()).toBe('after');
    });

    it('IRouter.routes is optional — App does not depend on it', async () => {
        // A minimal router that does NOT implement the optional `routes`
        // field — proves App can live without it.
        class NoEnumerationRouter implements Required<Pick<TrieRouter<RouteEntry>, 'add' | 'lookup' | 'clone'>> {
            private inner = new LinearRouter<RouteEntry>();
            add(route: Route<RouteEntry>) { this.inner.add(route); }
            lookup(p: string) { return this.inner.lookup(p); }
            clone() { return new NoEnumerationRouter(); }
        }

        const app = new App({ router: new NoEnumerationRouter() });
        app.get('/x', defineCoreHandler(() => 'ok'));

        const res = await app.fetch(createTestRequest('/x'));
        expect(await res.text()).toBe('ok');

        // clone() and extendOptions cascade should both work without
        // calling into the router's enumeration.
        const cloned = app.clone();
        const res2 = await cloned.fetch(createTestRequest('/x'));
        expect(await res2.text()).toBe('ok');
    });
});
