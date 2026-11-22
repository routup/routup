import { describe, expect, it } from 'vitest';
import { App, defineCoreHandler } from '../../../src';
import type { AppOptions } from '../../../src';
import { sendRedirectBack } from '../../../src/response/helpers/send-redirect-back';
import type { SendRedirectBackOptions } from '../../../src/response/helpers/send-redirect-back';
import { createTestRequest } from '../../helpers';

async function run(
    headers: Record<string, string>,
    options?: SendRedirectBackOptions,
    appOptions?: Partial<AppOptions>,
    init?: { ip?: string },
) {
    const app = new App({ options: appOptions });

    app.get('/', defineCoreHandler((event) => sendRedirectBack(event, options)));

    return app.fetch(createTestRequest('/', { headers, ...init }));
}

describe('src/response/helpers/send-redirect-back', () => {
    it('should redirect to the path of a same-origin referer', async () => {
        const res = await run({ host: 'localhost', referer: 'http://localhost/dashboard' });

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/dashboard');
    });

    it('should use the fallback for a cross-origin referer', async () => {
        const res = await run({ host: 'localhost', referer: 'http://evil.com/dashboard' });

        expect(res.headers.get('location')).toBe('/');
    });

    it('should use a custom fallback and status', async () => {
        const res = await run({ host: 'localhost' }, { fallback: '/home', status: 303 });

        expect(res.status).toBe(303);
        expect(res.headers.get('location')).toBe('/home');
    });

    it('should use the fallback for a missing or unparseable referer', async () => {
        expect((await run({ host: 'localhost' })).headers.get('location')).toBe('/');
        expect((await run({ host: 'localhost', referer: 'not a url' })).headers.get('location')).toBe('/');
    });

    it('should collapse a protocol-relative path', async () => {
        const res = await run({ host: 'localhost', referer: 'http://localhost//evil.com/x' });

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/evil.com/x');
    });

    it('should collapse a backslash path', async () => {
        const res = await run({ host: 'localhost', referer: 'http://localhost/\\evil.com/x' });

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/evil.com/x');
    });

    it('should not be fooled by userinfo or suffix hosts', async () => {
        const a = await run({ host: 'localhost', referer: 'http://localhost@evil.com/x' });
        const b = await run({ host: 'localhost', referer: 'http://localhost.evil.com/x' });

        expect(a.headers.get('location')).toBe('/');
        expect(b.headers.get('location')).toBe('/');
    });

    it('should drop the query by default and keep it with allowQuery', async () => {
        const referer = 'http://localhost/a?b=1';

        expect((await run({ host: 'localhost', referer })).headers.get('location')).toBe('/a');
        expect((await run({ host: 'localhost', referer }, { allowQuery: true })).headers.get('location')).toBe('/a?b=1');
    });

    it('should reject a scheme mismatch and a different port', async () => {
        const a = await run({ host: 'localhost', referer: 'https://localhost/x' });
        const b = await run({ host: 'localhost', referer: 'http://localhost:8080/x' });
        const c = await run({ host: 'localhost:8080', referer: 'http://localhost/x' });

        expect(a.headers.get('location')).toBe('/');
        expect(b.headers.get('location')).toBe('/');
        expect(c.headers.get('location')).toBe('/');
    });

    it('should keep the port and normalize default ports', async () => {
        const a = await run({ host: 'localhost:8080', referer: 'http://localhost:8080/x' });
        const b = await run({ host: 'localhost:80', referer: 'http://localhost/x' });

        expect(a.headers.get('location')).toBe('/x');
        expect(b.headers.get('location')).toBe('/x');
    });

    it('should use the forwarded origin behind a trusted proxy', async () => {
        const headers = {
            host: 'internal:3000',
            'x-forwarded-host': 'example.com',
            'x-forwarded-proto': 'https',
            referer: 'https://example.com/x',
        };

        const res = await run(headers, undefined, { trustProxy: () => true }, { ip: '10.0.0.1' });

        expect(res.headers.get('location')).toBe('/x');

        const other = await run(
            { ...headers, referer: 'http://internal:3000/x' },
            undefined,
            { trustProxy: () => true },
            { ip: '10.0.0.1' },
        );

        expect(other.headers.get('location')).toBe('/');
    });

    it('should ignore forwarded headers without a trusted proxy', async () => {
        const headers = {
            host: 'internal:3000',
            'x-forwarded-host': 'example.com',
            'x-forwarded-proto': 'https',
        };

        const spoofed = await run({ ...headers, referer: 'https://example.com/x' }, undefined, undefined, { ip: '10.0.0.1' });

        expect(spoofed.headers.get('location')).toBe('/');

        const real = await run({ ...headers, referer: 'http://internal:3000/x' }, undefined, undefined, { ip: '10.0.0.1' });

        expect(real.headers.get('location')).toBe('/x');
    });

    it('should use the request URL host when there is no Host header', async () => {
        const app = new App();

        app.get('/action', defineCoreHandler((event) => sendRedirectBack(event)));

        const same = await app.fetch(new Request('https://example.com/action', { headers: { referer: 'https://example.com/dashboard' } }));

        expect(same.headers.get('location')).toBe('/dashboard');

        const cross = await app.fetch(new Request('https://example.com/action', { headers: { referer: 'https://evil.com/dashboard' } }));

        expect(cross.headers.get('location')).toBe('/');
    });

    it.each([
        'blob:http://localhost/dashboard',
        'data:text/html,<p>x</p>',
        // eslint-disable-next-line no-script-url
        'javascript:alert(1)',
    ])('should use the fallback for the non-http(s) referer %s', async (referer) => {
        const res = await run({ host: 'localhost', referer });

        expect(res.headers.get('location')).toBe('/');
    });
});
