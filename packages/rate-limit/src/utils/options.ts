/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import type { Next, Request, Response } from 'routup';
import { getRequestIP, send } from 'routup';
import { RETRY_AGAIN_MESSAGE } from '../constants';
import { MemoryStore } from '../store';
import type { Options, OptionsInput, ValueDeterminingMiddleware } from '../type';

export function buildHandlerOptions(input?: OptionsInput) : Options {
    input = input || {};

    const options : Options = {
        windowMs: 60 * 1000,
        max: 5,
        message: RETRY_AGAIN_MESSAGE,
        statusCode: 429,
        skipFailedRequest: false,
        skipSuccessfulRequest: false,
        requestWasSuccessful: (request: Request, response: Response): boolean => response.statusCode < 400,
        skip: (_request: Request, _response: Response): boolean => false,
        keyGenerator: (request: Request, _response: Response): string => getRequestIP(request, { trustProxy: true }),
        async handler(
            request: Request,
            response: Response,
            _next: Next,
            _optionsUsed: Options,
        ): Promise<void> {
            // Set the response status code
            response.statusCode = options.statusCode;
            // Call the `message` if it is a function.
            const message: unknown = typeof options.message === 'function' ?
                await (options.message as ValueDeterminingMiddleware<any>)(
                    request,
                    response,
                ) :
                options.message;

            // Send the response if writable.
            if (!response.writableEnded) {
                send(response, message ?? 'Too many requests, please try again later.');
            }
        },
        ...input,

        store: input.store || new MemoryStore(),
    };

    return options;
}
