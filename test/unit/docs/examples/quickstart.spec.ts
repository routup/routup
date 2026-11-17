import { describe, expect, it } from 'vitest';
import { app } from '../../../../docs/examples/quickstart/app.ts';

describe('docs/examples/quickstart', () => {
    it('should answer the root path with text', async () => {
        const response = await app.fetch(new Request('http://localhost/'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/^text\/plain/);
        expect(await response.text()).toBe('Hello, World!');
    });

    it('should answer a user path with the id as JSON', async () => {
        const response = await app.fetch(new Request('http://localhost/users/42'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await response.json()).toEqual({ id: '42' });
    });
});
