import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import {
    send,
    sendFormat,
} from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/response/send-format', () => {
    it('should send format depending on accept header', async () => {
        const server = supertest(createRequestListener((req, res) => {
            sendFormat(res, {
                'text/html': () => {
                    send(res, 'text');
                },
                'application/json': () => {
                    send(res, 'json');
                },
                default: () => {
                    send(res, 'default');
                },
            });
        }));

        let response = await server
            .get('/')
            .set('Accept', 'text/html');

        expect(response.text).toEqual('text');

        response = await server
            .get('/')
            .set('Accept', 'application/json');

        expect(response.text).toEqual('json');

        response = await server
            .get('/')
            .set('Accept', 'foo/bar');

        expect(response.text).toEqual('default');
    });
});
