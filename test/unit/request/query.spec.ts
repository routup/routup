import supertest from 'supertest';
import {
    extendRequestQuery,
    hasRequestQuery,
    send, setRequestQuery, useRequestQuery,
} from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/request/query', () => {
    it('should receive empty record', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, useRequestQuery(req));
        }));

        const response = await server
            .get('/');

        expect(response.body).toEqual({});
    });

    it('should set and get request queries', async () => {
        const server = supertest(createRequestListener((req, res) => {
            setRequestQuery(req, {
                foo: 'bar',
            });

            send(res, useRequestQuery(req, 'foo'));
        }));

        const response = await server
            .get('/');

        expect(response.text).toEqual('bar');
    });

    it('should extend request query', async () => {
        const server = supertest(createRequestListener((req, res) => {
            setRequestQuery(req, {
                foo: 'bar',
            });

            if (hasRequestQuery(req)) {
                extendRequestQuery(req, {
                    bar: 'baz',
                });
            }

            send(res, useRequestQuery(req));
        }));

        const response = await server
            .get('/');

        expect(response.body).toEqual({
            foo: 'bar',
            bar: 'baz',
        });
    });
});
