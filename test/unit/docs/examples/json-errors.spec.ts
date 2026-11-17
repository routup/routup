import { describe, expect, it } from 'vitest';
import { app } from '../../../../docs/examples/json-errors/app.ts';

function get(path: string): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`));
}

describe('docs/examples/json-errors', () => {
    it('should send the status and message of an AppError', async () => {
        const response = await get('/validate');

        expect(response.status).toBe(422);
        expect(await response.json()).toEqual({ error: { status: 422, message: 'Name is required' } });
    });

    it('should send 500 for a plain Error', async () => {
        const response = await get('/crash');

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: { status: 500, message: 'boom' } });
    });

    it('should send the 404 fallback for an unknown path', async () => {
        const response = await get('/unknown');

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ status: 404, message: 'Not Found' });
    });
});
