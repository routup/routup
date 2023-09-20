import type { Request } from '../request';
import type { Response } from '../response';
import type { HANDLER_TYPE_KEY, HandlerType } from './constants';

export type Next = (err?: Error) => void;

export interface Handler {
    [HANDLER_TYPE_KEY]?: `${HandlerType.DEFAULT}`,

    (
        req: Request,
        res: Response,
        next: Next
    ): unknown | Promise<unknown>;
}

export interface ErrorHandler {
    [HANDLER_TYPE_KEY]?: `${HandlerType.ERROR}`,

    (
        err: Error,
        req: Request,
        res: Response,
        next: Next
    ) : unknown | Promise<unknown>;
}
