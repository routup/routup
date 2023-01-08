/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { performance } from 'node:perf_hooks';
import promClient, { Gauge } from 'prom-client';
import { Options } from '../type';

export function buildUptimeMetric(options: Options) : Gauge {
    const starTime = performance.now();

    return new promClient.Gauge({
        name: options.uptimeName,
        help: 'Duration in ms since application is up and running.',
        collect() {
            this.set(parseFloat((performance.now() - starTime).toFixed(2)));
        },
        registers: [
            options.registry,
        ],
    });
}
