/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { HeaderName, send } from 'routup';
import supertest from 'supertest';
import { createHandler } from '../../src';
import { RETRY_AGAIN_MESSAGE } from '../../src/constants';
import { createMiddleware } from '../middleware';

describe('src/module', () => {
    it('should set rate limit headers', async () => {
        const handler = createHandler();

        const server = supertest(createMiddleware((req, res) => {
            handler(req, res, () => {
                send(res);
            });
        }));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toEqual('5');
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');
        expect(response.headers[HeaderName.RATE_LIMIT_RESET]).toBeDefined();
        expect(response.headers[HeaderName.RETRY_AFTER]).toBeUndefined();

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toEqual('5');
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('3');
    });

    it('should not process any additional request', async () => {
        const handler = createHandler({
            max: 1,
        });

        const server = supertest(createMiddleware((req, res) => {
            handler(req, res, () => {
                send(res);
            });
        }));

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toEqual('1');
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('0');

        response = await server
            .get('/');

        expect(response.statusCode).toEqual(429);
        expect(response.text).toEqual(RETRY_AGAIN_MESSAGE);
        expect(response.headers[HeaderName.RETRY_AFTER]).toBeDefined();
    });

    it('should be possible to skip successfully responses', async () => {
        const handler = createHandler({
            skipSuccessfulRequest: true,
        });

        const server = supertest(createMiddleware((req, res) => {
            handler(req, res, () => {
                send(res);
            });
        }));

        let response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');

        response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');
    });

    it('should be possible to skip failed responses', async () => {
        const handler = createHandler({
            skipFailedRequest: true,
        });

        const server = supertest(createMiddleware((req, res) => {
            handler(req, res, () => {
                res.statusCode = 400;
                send(res);
            });
        }));

        let response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');

        response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toEqual('4');
    });

    it('should skip request', async () => {
        const handler = createHandler({
            skip: (req, res) => true,
        });

        const server = supertest(createMiddleware((req, res) => {
            handler(req, res, () => {
                send(res);
            });
        }));

        const response = await server
            .get('/');

        expect(response.headers[HeaderName.RATE_LIMIT_LIMIT]).toBeUndefined();
        expect(response.headers[HeaderName.RATE_LIMIT_REMAINING]).toBeUndefined();
        expect(response.headers[HeaderName.RATE_LIMIT_RESET]).toBeUndefined();
        expect(response.headers[HeaderName.RETRY_AFTER]).toBeUndefined();
    });
});
