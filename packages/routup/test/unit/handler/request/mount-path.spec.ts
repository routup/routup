/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import { Router, send, useRequestMountPath } from '../../../../src';

describe('src/helpers/request/mount-path', () => {
    it('should get base-url with predefined path', async () => {
        const router = new Router({
            path: '/foo',
        });

        router.get('', (req, res) => send(res, useRequestMountPath(req)));

        const server = supertest(router.createListener());

        const response = await server
            .get('/foo');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/foo');
    });

    it('should get base url with nested router', async () => {
        const child = new Router();
        child.get('/bar', (req, res) => send(res, useRequestMountPath(req)));

        const router = new Router();
        router.use('/foo', child);

        const server = supertest(router.createListener());

        const response = await server
            .get('/foo/bar');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/foo');
    });
});
