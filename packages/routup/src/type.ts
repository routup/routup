/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage, ServerResponse } from 'http';

export type ResponseFormat = {
    [key: string]: () => void,
    default: () => void
};

export interface Response extends ServerResponse {

}

export interface Request extends IncomingMessage {

}

export type Next = (err?: Error) => void;

export type Path = string | RegExp;

// --------------------------------------------------

export type ErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: Next
) => unknown;

export type Handler = (
    req: Request,
    res: Response,
    next: Next
) => unknown;

// --------------------------------------------------

export type DispatcherMeta = {
    /**
     * Params collected on path.
     */
    params?: Record<string, any>,
    /**
     * Path to check for the current instance.
     */
    path?: string
};
