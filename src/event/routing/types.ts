import type { MethodName } from '../../constants';
import type { RoutupError } from '../../error';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Next } from '../../types';

export type RoutingEvent = {
    /**
     * Request Object.
     */
    request: Request,

    /**
     * Response Object.
     */
    response: Response,

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
     * Ids of chained router instances.
     */
    routerPath: number[],

    /**
     * Signal that the request hasn't been handled.
     * Therefore, the request must be passed to the next handler or router in the chain.
     */
    next: Next,

    /**
     * Indicates if the routing event has been dispatched.
     */
    dispatched: boolean

    /**
     * Track the occurred error during the dispatch process.
     */
    error?: RoutupError
};

export type RoutingErrorEvent = RoutingEvent & {
    /**
     * Track the occurred error during the dispatch process.
     */
    error: RoutupError
};
