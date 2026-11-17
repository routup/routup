import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { app } from '../../../../docs/examples/static-files/app.ts';

function get(path: string): Promise<Response> {
    return app.fetch(new Request(`http://localhost${path}`));
}

describe('docs/examples/static-files', () => {
    it('should serve a file from public/', async () => {
        const response = await get('/assets/app.js');

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
        expect(response.headers.get('cache-control')).toBe('public,max-age=0,must-revalidate');
    });

    it('should answer 404 for a missing file instead of the fallback', async () => {
        const response = await get('/assets/missing.js');

        expect(response.status).toBe(404);
    });

    it('should serve index.html for a path that only starts with /api', async () => {
        const response = await get('/apiary');

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    });

    it('should serve index.html for a client-side route', async () => {
        const response = await get('/some/client/route');

        expect(response.status).toBe(200);
        expect(await response.text()).toBe(readFileSync(
            new URL('../../../../docs/examples/static-files/public/index.html', import.meta.url),
            'utf8',
        ));
    });

    it('should pass /api paths on to the API routes', async () => {
        const response = await get('/api/hello');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ message: 'Hello' });
    });

    it('should answer 404 for an unknown /api path', async () => {
        const response = await get('/api/missing');

        expect(response.status).toBe(404);
    });
});
