import { describe, expect, it } from 'vitest';
import { app } from '../../../../docs/examples/server-sent-events/app.ts';

describe('docs/examples/server-sent-events', () => {
    it('should stream three events and close', async () => {
        const response = await app.fetch(new Request('http://localhost/events'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/event-stream');
        expect(await response.text()).toBe(
            'id: 1\nevent: tick\ndata: one\n\n' +
            'id: 2\nevent: tick\ndata: two\n\n' +
            'id: 3\nevent: tick\ndata: three\n\n',
        );
    });
});
