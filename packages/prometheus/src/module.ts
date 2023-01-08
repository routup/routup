/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    Handler,
    setResponseHeaderContentType,
    useRequestPath,
    withLeadingSlash,
} from '@routup/core';
import promClient, {
    LabelValues,
    Registry,
} from 'prom-client';
import { buildRequestDurationMetric, buildUptimeMetric } from './metrics';
import { Metrics, OptionsInput } from './type';
import { buildHandlerOptions, onResponseFinished } from './utils';

export function createHandler(input?: Registry) : Handler {
    const registry : Registry = input || promClient.register;

    return async (req, res, next) => {
        registry.metrics()
            .then((output) => {
                setResponseHeaderContentType(res, registry.contentType);
                res.end(output);
            })
            .catch((err) => next(err));
    };
}

export function registerMetrics(
    router: { use: (handler: Handler) => void },
    input?: OptionsInput,
): Metrics {
    const options = buildHandlerOptions({
        ...(input || {}),
    });

    /* istanbul ignore next */
    if (options.collectDefaultMetrics) {
        promClient.collectDefaultMetrics(options.collectDefaultMetrics);
    }

    const metrics : Metrics = {};

    if (options.uptime) {
        metrics.uptime = buildUptimeMetric(options);
    }

    if (options.requestDuration) {
        metrics.requestDuration = buildRequestDurationMetric(options);
    }

    router.use(async (req, res, next) => {
        /* istanbul ignore next */
        if (options.skip(req)) {
            next();
            return;
        }

        if (metrics.requestDuration) {
            const path = withLeadingSlash(useRequestPath(req));

            const labels: LabelValues<string> = {};
            const timer = metrics.requestDuration.startTimer(labels);

            onResponseFinished(res, () => {
                labels.status_code = res.statusCode;
                labels.method = req.method;
                labels.path = typeof options.normalizePath === 'function' ?
                    options.normalizePath(path, req) :
                    path;

                if (options.requestDurationLabels) {
                    Object.assign(labels, options.requestDurationLabels);
                }

                if (options.requestDurationLabelTransformer) {
                    options.requestDurationLabelTransformer(labels, req, res);
                }

                timer();
            });
        }

        next();
    });

    return metrics;
}
