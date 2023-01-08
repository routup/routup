/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import promClient from 'prom-client';
import { MetricName, MetricTypeName } from '../constants';
import { Options, OptionsInput } from '../type';

export function buildHandlerOptions(input?: OptionsInput) : Options {
    input = input || {};

    return {
        uptime: true,
        uptimeName: MetricName.UPTIME,

        requestDuration: true,
        requestDurationName: MetricName.REQUEST_DURATION,
        requestDurationType: MetricTypeName.HISTOGRAM,

        skip: (req) => false,
        registry: promClient.register,

        ...input,

        requestDurationHistogram: input.requestDurationHistogram || {},
        requestDurationSummary: input.requestDurationSummary || {},
    };
}
