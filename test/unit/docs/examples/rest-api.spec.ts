import { describe, expect, it } from 'vitest';
import { app } from '../../../../docs/examples/rest-api/app.ts';

function send(method: string, path: string, body?: unknown): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`, {
        method,
        ...(body === undefined ?
            {} :
            {
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body),
            }),
    }));
}

describe('docs/examples/rest-api', () => {
    it('should create, read, update and delete a todo', async () => {
        let response = await send('GET', '/todos');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);

        response = await send('POST', '/todos', { title: 'Write docs' });
        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({
            id: 1,
            title: 'Write docs',
            done: false,
        });

        response = await send('GET', '/todos/1');
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            id: 1,
            title: 'Write docs',
            done: false,
        });

        response = await send('PATCH', '/todos/1', { done: true });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            id: 1,
            title: 'Write docs',
            done: true,
        });

        response = await send('DELETE', '/todos/1');
        expect(response.status).toBe(204);
        expect(await response.text()).toBe('');

        response = await send('GET', '/todos/99');
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ status: 404, message: 'Todo 99 not found' });
    });

    it('should reject a todo without a title', async () => {
        for (const body of [{}, { title: '' }, { title: 1 }]) {
            const response = await send('POST', '/todos', body);

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ status: 400, message: 'title must be a non-empty string' });
        }

        const response = await send('GET', '/todos');

        expect(await response.json()).toEqual([]);
    });

    it('should reject an invalid update', async () => {
        let response = await send('POST', '/todos', { title: 'Review docs' });
        const { id } = await response.json();

        expect(id).toBe(2);

        response = await send('PATCH', `/todos/${id}`, { title: '' });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ status: 400, message: 'title must be a non-empty string' });

        response = await send('PATCH', `/todos/${id}`, { done: 'yes' });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ status: 400, message: 'done must be a boolean' });

        response = await send('GET', `/todos/${id}`);
        expect(await response.json()).toEqual({
            id,
            title: 'Review docs',
            done: false,
        });
    });
});
