/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Handler } from '@routup/core';
import { HeaderName } from '@routup/core';
import { setRequestRateLimitInfo, useRequestRateLimitInfo } from './request';
import type { OptionsInput } from './type';
import { buildHandlerOptions } from './utils';

export function createHandler(input?: OptionsInput) : Handler {
    const options = buildHandlerOptions({
        ...(input || {}),
    });

    if (typeof options.store.init === 'function') {
        options.store.init(options);
    }

    return async (req, res, next) => {
        const skip = await options.skip(req, res);
        if (skip) {
            next();
            return;
        }

        const key = await options.keyGenerator(req, res);

        const { totalHits, resetTime } = await options.store.increment(key);

        const retrieveQuota = typeof options.max === 'function' ?
            options.max(req, res) :
            options.max;

        const maxHits = await retrieveQuota;

        setRequestRateLimitInfo(req, {
            limit: maxHits,
            current: totalHits,
            remaining: Math.max(maxHits - totalHits, 0),
            resetTime,
        });

        if (!res.headersSent) {
            res.setHeader(HeaderName.RATE_LIMIT_LIMIT, maxHits);
            res.setHeader(
                HeaderName.RATE_LIMIT_REMAINING,
                useRequestRateLimitInfo(req, 'remaining'),
            );

            if (resetTime) {
                const deltaSeconds = Math.ceil(
                    (resetTime.getTime() - Date.now()) / 1000,
                );
                res.setHeader(HeaderName.RATE_LIMIT_RESET, Math.max(0, deltaSeconds));
            }
        }

        if (
            options.skipFailedRequest ||
            options.skipSuccessfulRequest
        ) {
            let decremented = false;
            const decrementKey = async () => {
                if (!decremented) {
                    await options.store.decrement(key);
                    decremented = true;

                    setRequestRateLimitInfo(req, 'remaining', Math.max(maxHits - totalHits - 1, 0));
                }
            };

            if (options.skipFailedRequest) {
                res.on('finish', async () => {
                    if (!options.requestWasSuccessful(req, res)) {
                        await decrementKey();
                    }
                });

                res.on('close', async () => {
                    if (!res.writableEnded) {
                        await decrementKey();
                    }
                });

                res.on('error', async () => {
                    await decrementKey();
                });
            }

            if (options.skipSuccessfulRequest) {
                res.on('finish', async () => {
                    if (options.requestWasSuccessful(req, res)) {
                        await decrementKey();
                    }
                });
            }
        }

        if (
            maxHits &&
            totalHits > maxHits
        ) {
            if (!res.headersSent) {
                res.setHeader(
                    HeaderName.RETRY_AFTER,
                    Math.ceil(options.windowMs / 1000),
                );
            }

            options.handler(req, res, next, options);
            return;
        }

        next();
    };
}
