/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import {
    extendRequestCookies,
    hasRequestCookies,
    send,
    setRequestCookies,
    useRequestCookie,
    useRequestCookies,
} from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/request/cookie', () => {
    it('should receive empty record', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, useRequestCookies(req));
        }));

        const response = await server
            .get('/');

        expect(response.body).toEqual({});
    });

    it('should set and get request cookies', async () => {
        const server = supertest(createHandler((req, res) => {
            setRequestCookies(req, {
                foo: 'bar',
            });

            send(res, useRequestCookie(req, 'foo'));
        }));

        const response = await server
            .get('/');

        expect(response.text).toEqual('bar');
    });

    it('should extend request cookies', async () => {
        const server = supertest(createHandler((req, res) => {
            setRequestCookies(req, {
                foo: 'bar',
            });

            if (hasRequestCookies(req)) {
                extendRequestCookies(req, {
                    bar: 'baz',
                });
            }

            send(res, useRequestCookies(req));
        }));

        const response = await server
            .get('/');

        expect(response.body).toEqual({
            foo: 'bar',
            bar: 'baz',
        });
    });
});
