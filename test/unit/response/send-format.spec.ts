import { describe, expect, it } from 'vitest';
import { DispatchEvent } from '../../../src/dispatcher/event/module';
import { sendFormat } from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/response/send-format', () => {
    it('should select format depending on accept header', () => {
        const eventHtml = new DispatchEvent(createTestRequest('/', { headers: { 'accept': 'text/html' } }));

        const resultHtml = sendFormat(eventHtml, {
            'text/html': () => 'text',
            'application/json': () => 'json',
            default: () => 'default',
        });

        expect(resultHtml).toEqual('text');
    });

    it('should select json format', () => {
        const event = new DispatchEvent(createTestRequest('/', { headers: { 'accept': 'application/json' } }));

        const result = sendFormat(event, {
            'text/html': () => 'text',
            'application/json': () => 'json',
            default: () => 'default',
        });

        expect(result).toEqual('json');
    });

    it('should use default format for unmatched accept', () => {
        const event = new DispatchEvent(createTestRequest('/', { headers: { 'accept': 'foo/bar' } }));

        const result = sendFormat(event, {
            'text/html': () => 'text',
            'application/json': () => 'json',
            default: () => 'default',
        });

        expect(result).toEqual('default');
    });
});
