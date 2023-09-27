import supertest from 'supertest';
import {
    extendRequestCookies,
    hasRequestCookies,
    send,
    setRequestCookies,
    useRequestCookie,
    useRequestCookies,
} from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/request/cookie', () => {
    it('should receive empty record', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, useRequestCookies(req));
        }));

        const response = await server
            .get('/');

        expect(response.body).toEqual({});
    });

    it('should set and get request cookies', async () => {
        const server = supertest(createRequestListener((req, res) => {
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
        const server = supertest(createRequestListener((req, res) => {
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
