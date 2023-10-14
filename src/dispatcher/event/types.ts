import type { MethodName } from '../../constants';
import type { RoutupError } from '../../error';
import type { Handler } from '../../handler';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Router } from '../../router';
import type { Next } from '../../types';

export type DispatcherRouterMatch = {
    type: 'router',
    data: Router
};

export type DispatcherHandlerMatch = {
    type: 'handler',
    data: Handler
};

export type DispatcherMatch = DispatcherRouterMatch | DispatcherHandlerMatch;

export type DispatcherEvent = {
    // todo: rename to request?
    req: Request,

    // todo: rename to response?
    res: Response,

    // todo: set router as match on initial dispatch process -> non optional
    match?: DispatcherMatch,

    /**
     * Params collected during execution.
     */
    params: Record<string, any>,

    /**
     * Path to check for the current instance.
     */
    path: string,

    /**
     * HTTP Method used for the request.
     */
    method: `${MethodName}`,

    /**
     * The relative path on which the router is hung.
     */
    mountPath: string,

    /**
     * The error which occurred during the dispatch process.
     */
    error?: RoutupError,

    /**
     * Signal that the request hasn't been handled.
     * Therefore, the request must be passed to the next handler or router in the chain.
     */
    next: Next,

    /**
     * Ids of chained router instances.
     */
    routerPath: number[]
};
