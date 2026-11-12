import { describe, expect, it } from 'vitest';
import {
    HeaderName,
    createEventStream,
    serializeEventStreamComment,
    serializeEventStreamMessage,
} from '../../../src';
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

            if (done) {
                break;
            }

            result += decoder.decode(value, { stream: true });
        }

        expect(result).toContain('data: hello world');
        expect(result).toContain('data: second message');
    });

    it('should return true on successful write', () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event);

        expect(stream.write({ data: 'hello' })).toBe(true);
        expect(stream.write('hello')).toBe(true);
        stream.end();
    });

    it('should return false when stream is closed', () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event);

        stream.end();

        expect(stream.write({ data: 'hello' })).toBe(false);
    });

    it('should return false when message exceeds maxMessageSize', () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event, { maxMessageSize: 10 });

        expect(stream.write({ data: 'this is a very long message' })).toBe(false);
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

    it('should write comments', async () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event);

        expect(stream.writeComment('ping')).toBe(true);
        stream.end();
        expect(stream.writeComment('ping')).toBe(false);

        expect(await stream.response.text()).toBe(': ping\n\n');
    });

    it('should apply maxMessageSize to comments', () => {
        const event = createTestEvent('/');
        const stream = createEventStream(event, { maxMessageSize: 4 });

        expect(stream.writeComment('a long comment')).toBe(false);
    });

    it('should serialize a comment per line', () => {
        expect(serializeEventStreamComment('ping')).toBe(': ping\n\n');
        expect(serializeEventStreamComment('a\r\nb\rc\nd')).toBe(': a\n: b\n: c\n: d\n\n');
    });

    it('should treat CRLF, CR and LF in data as line breaks', () => {
        expect(serializeEventStreamMessage({ data: 'a\r\nb\rc\nd' }))
            .toBe('data: a\ndata: b\ndata: c\ndata: d\n\n');
    });

    it('should serialize an empty id', () => {
        expect(serializeEventStreamMessage({ id: '', data: 'a' })).toBe('id: \ndata: a\n\n');
        expect(serializeEventStreamMessage({ data: 'a' })).toBe('data: a\n\n');
    });

    it('should serialize id, event and retry', () => {
        expect(serializeEventStreamMessage({
            id: '1\n2',
            event: 'up\rdate',
            retry: 1000,
            data: 'a',
        })).toBe('id: 12\nevent: update\nretry: 1000\ndata: a\n\n');
    });
});
