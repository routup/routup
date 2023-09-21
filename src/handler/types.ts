import type { Request } from '../request';
import type { Response } from '../response';
import type { HANDLER_PROPERTY_TYPE_KEY, HandlerType } from './constants';

export type Next = (err?: Error) => void;

export interface Handler {
    [HANDLER_PROPERTY_TYPE_KEY]?: `${HandlerType.DEFAULT}`,

    (
        req: Request,
        res: Response,
        next: Next
    ): unknown | Promise<unknown>;
}

export type HandlerContext = {
    request: Request,
    response: Response,
    next: Next
};

export interface ContextHandler {
    [HANDLER_PROPERTY_TYPE_KEY]?: `${HandlerType.DEFAULT_CONTEXT}`,

    (context: HandlerContext): unknown | Promise<unknown>;
}

export interface ErrorHandler {
    [HANDLER_PROPERTY_TYPE_KEY]?: `${HandlerType.ERROR}`,

    (
        err: Error,
        req: Request,
        res: Response,
        next: Next
    ) : unknown | Promise<unknown>;
}

export type ErrorHandlerContext = HandlerContext & {
    error: Error
};

export interface ErrorContextHandler {
    [HANDLER_PROPERTY_TYPE_KEY]?: `${HandlerType.ERROR_CONTEXT}`,

    (context: ErrorHandlerContext) : unknown | Promise<unknown>;
}
