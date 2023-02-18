/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import type { IncomingMessage, ServerResponse } from 'http';

export interface Response extends ServerResponse {

}

export interface Request extends IncomingMessage {

}

export type Next = (err?: Error) => void;

// --------------------------------------------------

export type Handler = (
    req: Request,
    res: Response,
    next: Next
) => unknown;

export type ErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: Next
) => unknown;
