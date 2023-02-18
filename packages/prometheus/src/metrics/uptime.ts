/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { performance } from 'node:perf_hooks';
import type { Gauge } from 'prom-client';
import promClient from 'prom-client';
import type { Options } from '../type';

export function buildUptimeMetric(options: Options) : Gauge {
    const starTime = performance.now();

    return new promClient.Gauge({
        name: options.uptimeName,
        help: 'duration (sec) since application is up and running.',
        collect() {
            this.set(parseInt(`${((performance.now() - starTime) / 1000)}`, 10));
        },
        registers: [
            options.registry,
        ],
    });
}
