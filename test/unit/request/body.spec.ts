/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import {
    extendRequestBody, send, setRequestBody, useRequestBody,
} from '../../../src';
import { createHandler } from '../../handler';

describe('src/module', () => {
    it('should get body', async () => {
        const server = supertest(createHandler((req, res) => {
            setRequestBody(req, { foo: 'bar' });

            setRequestBody(req, { bar: 'baz' });

            extendRequestBody(req, { baz: 'foo' });

            send(res, useRequestBody(req));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ bar: 'baz', baz: 'foo' });
    });

    it('should get empty body', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, useRequestBody(req));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({});
    });

    it('should get body param', async () => {
        const server = supertest(createHandler((req, res) => {
            setRequestBody(req, 'foo', 'bar');

            setRequestBody(req, 'foo', 'baz');

            send(res, useRequestBody(req, 'foo'));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('baz');
    });

    it('should get empty body param', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, useRequestBody(req, 'foo'));
        }));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({});
    });
});
