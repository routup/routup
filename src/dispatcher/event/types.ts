import type { RoutupError } from '../../error';
import type { Handler } from '../../handler';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Router } from '../../router';

export type DispatcherRouterMatch = {
    type: 'router',
    data: Router
};

export type DispatcherHandlerMatch = {
    type: 'handler',
    data: Handler
};

export type DispatcherMatch = DispatcherRouterMatch | DispatcherHandlerMatch;

// todo: add next/passThrough property.
export type DispatcherEvent = {
    // todo: rename to request?
    req: Request,

    // todo: rename to response?
    res: Response,

    // todo: set router as match on initial dispatch process -> non optional
    match?: DispatcherMatch,

    /**
     * Params collected on path.
     */
    params: Record<string, any>,

    /**
     * Path to check for the current instance.
     */
    path: string,

    /**
     * The relative path on which the router is hung.
     */
    mountPath: string,

    /**
     * The error which occurred during a previous handler.
     */
    error?: RoutupError,

    /**
     * Ids of chained router instances.
     */
    routerPath: number[]
};
