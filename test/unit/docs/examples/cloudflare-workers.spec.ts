import { describe, expect, it } from 'vitest';
import { defineCoreHandler, getRequestIP } from 'routup';
import { app } from '../../../../docs/examples/cloudflare-workers/app.ts';
import worker from '../../../../docs/examples/cloudflare-workers/worker.ts';

const env = { GREETING: 'Hello from env' };
const context = { waitUntil() {}, passThroughOnException() {} };

// Spec-local routes that check what the worker hands to handlers.
app.get('/__test/ip', defineCoreHandler((event) => getRequestIP(event) ?? null));
app.get('/__test/env', defineCoreHandler((event) => event.request.runtime?.cloudflare?.env ?? null));
app.get('/__test/context', defineCoreHandler((event) => event.request.runtime?.cloudflare?.context === context));

describe('docs/examples/cloudflare-workers', () => {
    it('should answer through the module worker fetch', async () => {
        const response = await worker.fetch(new Request('http://localhost/'), env, context);

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('Hello from Workers');
    });

    it('should read the client IP from cf-connecting-ip', async () => {
        const response = await worker.fetch(new Request('http://localhost/__test/ip', { headers: { 'cf-connecting-ip': '203.0.113.7' } }), env, context);

        expect(await response.text()).toBe('203.0.113.7');
    });

    it('should hand env to the handler', async () => {
        const response = await worker.fetch(new Request('http://localhost/__test/env'), env, context);

        expect(await response.json()).toEqual(env);
    });

    it('should hand the execution context to the handler', async () => {
        const response = await worker.fetch(new Request('http://localhost/__test/context'), env, context);

        expect(await response.json()).toBe(true);
    });
});
