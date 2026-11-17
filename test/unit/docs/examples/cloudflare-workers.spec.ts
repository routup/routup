import { describe, expect, it } from 'vitest';
import worker from '../../../../docs/examples/cloudflare-workers/worker.ts';

describe('docs/examples/cloudflare-workers', () => {
    it('should answer through the module worker fetch', async () => {
        const response = await worker.fetch(new Request('http://localhost/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('Hello from Workers');
    });
});
