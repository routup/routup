import { describe, expect, it } from 'vitest';
import { defineCoreHandler } from 'routup';
import { app, users } from '../../../../docs/examples/modular-apps/app.ts';

function get(path: string): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`));
}

describe('docs/examples/modular-apps', () => {
    it('should answer the routes of the mounted apps', async () => {
        let response = await get('/users/1');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: '1', name: 'Alice' });

        response = await get('/posts/1');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: '1', title: 'Hello' });
    });

    it('should not see a route added to a child after mounting', async () => {
        users.get('/', defineCoreHandler(() => 'late'));

        const child = await users.fetch(new Request('http://localhost/'));

        expect(await child.text()).toBe('late');

        const response = await get('/users');

        expect(response.status).toBe(404);
    });
});
