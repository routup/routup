/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {Router} from "routup";
import supertest from "supertest";
import qs from "qs";
import {registerController} from "../../src/module";
import {QueryController} from "../data/query";

describe('src/decorator', () => {
    it('should handle query decorator', async () => {
        const router = new Router();
        registerController(router, QueryController);

        const server = supertest(router.createListener());

        const query = {
            foo: 'bar'
        }

        let response = await server
            .get('/many?'+ qs.stringify(query))

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({foo: 'bar'});

        response = await server
            .get('/single?'+ qs.stringify(query))

        expect(response.statusCode).toEqual(200);
        expect(response.text).toEqual('bar');
    })
});
