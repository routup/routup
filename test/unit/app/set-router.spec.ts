import { describe, expect, it } from 'vitest';
import {
    App,
    TrieRouter,
    defineCoreHandler,
} from '../../../src';
import type { Handler } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('App.setRouter', () => {
    it('replays previously-registered routes onto the new router', async () => {
        const app = new App();
        app.get('/users/:id', defineCoreHandler((event) => `id=${event.params.id}`));
        app.post('/users', defineCoreHandler(() => 'created'));

        // Swap from the default LinearRouter to a TrieRouter mid-flight.
        app.setRouter(new TrieRouter<Handler>());

        const a = await app.fetch(createTestRequest('/users/42'));
        expect(await a.text()).toBe('id=42');

        const b = await app.fetch(createTestRequest('/users', { method: 'POST' }));
        expect(await b.text()).toBe('created');
    });

    it('routes registered after setRouter land on the new router', async () => {
        const app = new App();
        app.get('/before', defineCoreHandler(() => 'before'));

        app.setRouter(new TrieRouter<Handler>());
        app.get('/after', defineCoreHandler(() => 'after'));

        expect(await (await app.fetch(createTestRequest('/before'))).text()).toBe('before');
        expect(await (await app.fetch(createTestRequest('/after'))).text()).toBe('after');
    });
});
