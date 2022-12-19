/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import supertest from 'supertest';
import { send, useRequestMountPath } from '../../../src';
import { createHandler } from '../../handler';

describe('src/helpers/request/mount-path', () => {
    it('should get mount path', async () => {
        const server = supertest(createHandler((req, res) => send(res, useRequestMountPath(req))));

        const response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('/');
    });
});
