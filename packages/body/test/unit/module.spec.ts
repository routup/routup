/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from "supertest";
import { send, Router, useRequestBody } from "routup";
import {
    createRequestJsonParser,
    createRequestRawParser,
    createRequestTextParser,
    createRequestUrlEncodedParser
} from "../../src";

describe('src/**', () => {
    it('should parse application/json', async () => {
        const router = new Router();

        router.use(createRequestJsonParser());

        router.post('/',  (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(router.createListener());

        let response = await server
            .post('/')
            .send({
                foo: 'bar'
            })

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({foo: 'bar'});
    });

    it('should parse application/x-www-form-urlencoded', async () => {
        const router = new Router();

        router.use(createRequestUrlEncodedParser({extended: false}));

        router.post('/',  (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(router.createListener());

        let response = await server
            .post('/')
            .send('foo=bar');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({foo: 'bar'});
    });

    it('should parse raw to buffer', async () => {
        const router = new Router();

        router.use(createRequestRawParser());

        router.post('/',  (req, res) => {
            const foo = useRequestBody(req);

            send(res, Buffer.isBuffer(foo));
        });

        const server = supertest(router.createListener());

        let response = await server
            .post('/')
            .set('Content-Type', 'application/octet-stream')
            .send('foo')

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(true);
    });

    it('should parse text/html to text', async () => {
        const router = new Router();

        router.use(createRequestTextParser({type: 'text/html'}));

        router.post('/',  (req, res) => {
            const foo = useRequestBody(req);

            send(res, foo);
        });

        const server = supertest(router.createListener());

        let response = await server
            .post('/')
            .set('Content-Type', 'text/html')
            .send('<div>foo</div>')

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('<div>foo</div>');
    });
})
