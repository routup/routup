import { describe, expect, it } from 'vitest';
import { DispatchEvent } from '../../../src/dispatcher/event/module';
import {
    HeaderName,
    appendResponseHeader,
    appendResponseHeaderDirective,
    setResponseHeaderAttachment,
    setResponseHeaderContentType,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/response/header', () => {
    it('should set header attachment', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseHeaderAttachment(event);

        expect(event.response.headers.get(HeaderName.CONTENT_DISPOSITION))
            .toEqual('attachment');
    });

    it('should set header attachment by filename', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseHeaderAttachment(event, 'dummy.json');

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json; charset=utf-8');
        expect(event.response.headers.get(HeaderName.CONTENT_DISPOSITION))
            .toEqual('attachment; filename="dummy.json"; filename*=UTF-8\'\'dummy.json');
    });

    it('should append value', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        appendResponseHeader(event, HeaderName.SET_COOKIE, 'foo=bar; Path=/');
        appendResponseHeader(event, HeaderName.SET_COOKIE, 'bar=baz; Path=/');

        const cookies = event.response.headers.getSetCookie();
        expect(cookies).toEqual([
            'foo=bar; Path=/',
            'bar=baz; Path=/',
        ]);
    });

    it('should set header directive value', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        appendResponseHeaderDirective(event, HeaderName.CONTENT_TYPE, 'boundary=something');

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('boundary=something');
    });

    it('should set multiple header directive values', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        appendResponseHeaderDirective(event, HeaderName.CONTENT_TYPE, [
            'application/json',
            'boundary=something',
        ]);

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json; boundary=something');
    });

    it('should append single header directive value', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseHeaderAttachment(event, 'dummy.json');
        appendResponseHeaderDirective(event, HeaderName.CONTENT_TYPE, 'boundary=something');

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json; charset=utf-8; boundary=something');
    });

    it('should append multiple header directive values', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseHeaderAttachment(event, 'dummy.json');
        appendResponseHeaderDirective(event, HeaderName.CONTENT_TYPE, [
            'charset=utf-8',
            'boundary=something',
        ]);

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json; charset=utf-8; boundary=something');
    });

    it('should set response content type', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseHeaderContentType(event, 'application/json');
        setResponseHeaderContentType(event, 'text/html', true);

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('application/json');
    });

    it('should overwrite response content-type', () => {
        const event = new DispatchEvent(createTestRequest('/'));

        setResponseHeaderContentType(event, 'application/json');
        setResponseHeaderContentType(event, 'text/html');

        expect(event.response.headers.get(HeaderName.CONTENT_TYPE))
            .toEqual('text/html');
    });
});
