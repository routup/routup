import { describe, expect, it } from 'vitest';
import { app } from '../../../../docs/examples/auth-middleware/app.ts';

function get(path: string, headers?: Record<string, string>): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`, { headers }));
}

describe('docs/examples/auth-middleware', () => {
    it('should answer the public route without a header', async () => {
        const response = await get('/health');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: 'ok' });
    });

    it('should reject a request without a header', async () => {
        const response = await get('/me');

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ status: 401, message: 'Unauthorized' });
    });

    it('should reject a wrong token', async () => {
        const response = await get('/me', { authorization: 'Bearer wrong' });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ status: 401, message: 'Unauthorized' });
    });

    it('should reject an unknown path without a header', async () => {
        const response = await get('/unknown');

        expect(response.status).toBe(401);
    });

    it('should pass the user to the downstream handler', async () => {
        const response = await get('/me', { authorization: 'Bearer secret-token' });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ name: 'Alice' });
    });
});
