import { describe, expect, it } from 'vitest';
import { HeaderName, createEventStream } from '../../../src';
import { createTestEvent } from '../../helpers';

describe('src/helpers/response/event-stream', () => {
    it('should create event stream with correct headers', () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event);

        expect(stream.response).toBeInstanceOf(Response);
        expect(stream.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('text/event-stream');
    });

    it('should write and read events', async () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event);

        stream.write({ data: 'hello world' });
        stream.write({ data: 'second message' });
        stream.end();

        const reader = stream.response.body!.getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }

        expect(result).toContain('data: hello world');
        expect(result).toContain('data: second message');
    });

    it('should write string messages', async () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event);

        stream.write('hello');
        stream.end();

        const reader = stream.response.body!.getReader();
        const decoder = new TextDecoder();
        const { value } = await reader.read();
        const text = decoder.decode(value);

        expect(text).toContain('data: hello');
    });
});
