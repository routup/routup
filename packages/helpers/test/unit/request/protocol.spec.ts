/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {Router} from "routup";
import supertest from "supertest";
import {HeaderName, send, getRequestProtocol} from "../../../src";

describe('src/helpers/request/hostname', () => {
    it('should determine protocol', async () => {
        const router = new Router();

        router.get('/', async (req, res) => {
            send(res, getRequestProtocol(req, { default: 'http', trustProxy: true }));
        });

        router.get('/not-trusted', (req, res) => {
            send(res, getRequestProtocol(req));
        })

        const server = supertest(router.createListener());

        await server
            .get('/')
            .expect('http');

        await server
            .get('/')
            .set(HeaderName.X_FORWARDED_PROTO, 'https')
            .expect('https');

        await server
            .get('/not-trusted')
            .set(HeaderName.X_FORWARDED_PROTO, 'https')
            .expect('http');
    })
})
