/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import supertest from 'supertest';
import { HeaderName, getRequestProtocol, send } from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/request/hostname', () => {
    it('should determine protocol', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, getRequestProtocol(req, { default: 'http', trustProxy: true }));
        }));

        await server
            .get('/')
            .expect('http');
    });

    it('should determine protocol of non-trusted', async () => {
        const server = supertest(createHandler((req, res) => {
            send(res, getRequestProtocol(req));
        }));

        await server
            .get('/')
            .set(HeaderName.X_FORWARDED_PROTO, 'https')
            .expect('http');
    });
});
