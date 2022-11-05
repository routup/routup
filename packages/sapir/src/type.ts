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

export type Next = (err?: Error) => void;

export interface Response extends ServerResponse {

}

export interface Request extends IncomingMessage {

}

export type ErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: CallableFunction
) => unknown;

export type RouteHandler = (
    req: Request,
    res: Response,
    next: CallableFunction
) => unknown;

export type RouterOptions = {
    /**
     * Milliseconds (ms) until request should time out.
     *
     * @type number
     * @default 60_000
     */
    timeout?: number,

    /**
     * Is this the root router ?
     *
     * @type boolean
     * @default false
     */
    root?: boolean

    /**
     * Mount path.
     *
     * @type string
     * @default '/'
     */
    mountPath?: string
};
