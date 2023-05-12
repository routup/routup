/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Router, send } from 'routup';
import { Registry } from 'prom-client';
import supertest from 'supertest';
import type { OptionsInput } from '../../src';
import {
    MetricName,
    createHandler,
    registerMetrics,
} from '../../src';

function createRouterWithHandlers(options?: OptionsInput) : Router {
    options = options || {};

    if (!options.registry) {
        options.registry = new Registry();
    }

    const router = new Router();
    registerMetrics(router, options);

    router.get('/metrics', createHandler(options.registry));

    router.get('/', (req, res) => {
        send(res);
    });

    return router;
}

describe('src/module', () => {
    it('should serve metrics', async () => {
        const router = createRouterWithHandlers();

        const server = supertest(router.createListener());

        let response = await server
            .get('/');

        expect(response.statusCode).toEqual(200);

        response = await server
            .get('/metrics');

        expect(response.statusCode).toEqual(200);
        expect(response.text.includes(`TYPE ${MetricName.REQUEST_DURATION} histogram`)).toBeTruthy();
        expect(response.text.includes(`TYPE ${MetricName.REQUEST_DURATION} summary`)).toBeFalsy();
        expect(response.text.includes(`TYPE ${MetricName.UPTIME} gauge`)).toBeTruthy();
    });

    it('should server request summary duration metric', async () => {
        const router = createRouterWithHandlers({
            requestDurationType: 'summary',
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/metrics');

        expect(response.statusCode).toEqual(200);
        expect(response.text.includes(`TYPE ${MetricName.REQUEST_DURATION} histogram`)).toBeFalsy();
        expect(response.text.includes(`TYPE ${MetricName.REQUEST_DURATION} summary`)).toBeTruthy();
    });

    it('should not serve request duration metric', async () => {
        const router = createRouterWithHandlers({
            requestDuration: false,
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/metrics');

        expect(response.statusCode).toEqual(200);
        expect(response.text.includes(`TYPE ${MetricName.REQUEST_DURATION} histogram`)).toBeFalsy();
        expect(response.text.includes(`TYPE ${MetricName.REQUEST_DURATION} summary`)).toBeFalsy();
    });

    it('should not serve uptime metric', async () => {
        const router = createRouterWithHandlers({
            uptime: false,
        });

        const server = supertest(router.createListener());

        const response = await server
            .get('/metrics');

        expect(response.statusCode).toEqual(200);
        expect(response.text.includes(`TYPE ${MetricName.UPTIME} gauge`)).toBeFalsy();
    });
});
