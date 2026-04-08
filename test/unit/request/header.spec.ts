import { describe, expect, it } from 'vitest';
import {
    HeaderName,
    getRequestAcceptableCharset,
    getRequestAcceptableCharsets,
    getRequestAcceptableContentType,
    getRequestAcceptableContentTypes,
    getRequestAcceptableEncoding,
    getRequestAcceptableEncodings,
    getRequestAcceptableLanguage,
    getRequestAcceptableLanguages,
    getRequestHeader,
    matchRequestContentType,
} from '../../../src';
import { createTestEvent } from '../../helpers';

describe('src/helpers/request/header', () => {
    it('should get request header', () => {
        const event = createTestEvent('/', { headers: { 'accept-language': 'de' } });

        expect(getRequestHeader(event, 'accept-language')).toEqual('de');
    });

    it('should return null for missing header', () => {
        const event = createTestEvent('/');

        expect(getRequestHeader(event, 'x-missing')).toBeNull();
    });

    it('should get all covered accept header values', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT]: 'application/json, text/html' } });

        const accepts = getRequestAcceptableContentTypes(event);
        expect(accepts).toEqual(['application/json', 'text/html']);
    });

    it('should get covered accept header value', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT]: 'application/json, text/html' } });

        expect(getRequestAcceptableContentType(event, 'json')).toEqual('json');
    });

    it('should return first option when no accept header', () => {
        const event = createTestEvent('/');

        expect(getRequestAcceptableContentType(event, 'json')).toEqual('json');
    });

    it('should return undefined when accept header does not match', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT]: 'image/png' } });

        expect(getRequestAcceptableContentType(event, 'json')).toBeFalsy();
    });

    it('should get covered accept header value for multiple options', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT]: 'application/json' } });

        expect(getRequestAcceptableContentType(event, ['text', 'json'])).toEqual('json');
    });

    it('should get all covered accept charset header values', () => {
        const event = createTestEvent('/');

        expect(getRequestAcceptableCharsets(event)).toEqual(['*']);
    });

    it('should get covered accept charset header value with specific charset', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_CHARSET]: 'utf-8' } });

        expect(getRequestAcceptableCharsets(event)).toEqual(['utf-8']);
    });

    it('should get covered accept charset header value', () => {
        const event = createTestEvent('/');

        expect(getRequestAcceptableCharset(event, 'utf-8')).toEqual('utf-8');
    });

    it('should return falsy for non-matching charset', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_CHARSET]: 'binary' } });

        expect(getRequestAcceptableCharset(event, 'utf-8')).toBeFalsy();
    });

    it('should get all covered accept encoding header values', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_ENCODING]: 'gzip, deflate' } });

        const encodings = getRequestAcceptableEncodings(event);
        expect(encodings).toEqual(['gzip', 'deflate', 'identity']);
    });

    it('should get covered accept encoding header value', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_ENCODING]: 'gzip' } });

        expect(getRequestAcceptableEncoding(event, 'gzip')).toEqual('gzip');
    });

    it('should return falsy for non-matching encoding', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_ENCODING]: 'deflate' } });

        expect(getRequestAcceptableEncoding(event, 'gzip')).toBeFalsy();
    });

    it('should get all covered accept language header values', () => {
        const event = createTestEvent('/');

        expect(getRequestAcceptableLanguages(event)).toEqual(['*']);
    });

    it('should get specific accept language header values', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_LANGUAGE]: 'en' } });

        expect(getRequestAcceptableLanguages(event)).toEqual(['en']);
    });

    it('should get covered accept language header value', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_LANGUAGE]: 'de' } });

        expect(getRequestAcceptableLanguage(event, 'de')).toEqual('de');
    });

    it('should return falsy for non-matching language', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_LANGUAGE]: 'en' } });

        expect(getRequestAcceptableLanguage(event, 'de')).toBeFalsy();
    });

    it('should get covered accept language header value for multiple options', () => {
        const event = createTestEvent('/', { headers: { [HeaderName.ACCEPT_LANGUAGE]: 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5' } });

        expect(getRequestAcceptableLanguage(event, ['de', 'en'])).toEqual('en');
    });

    it('should match request content type', () => {
        const eventJson = createTestEvent('/', { headers: { [HeaderName.CONTENT_TYPE]: 'application/json; charset=utf-8' } });

        expect(matchRequestContentType(eventJson, 'json')).toBe(true);

        const eventHtml = createTestEvent('/', { headers: { [HeaderName.CONTENT_TYPE]: 'text/html; charset=utf-8' } });

        expect(matchRequestContentType(eventHtml, 'json')).toBe(false);

        const eventNone = createTestEvent('/');

        expect(matchRequestContentType(eventNone, 'json')).toBe(true);
    });
});
