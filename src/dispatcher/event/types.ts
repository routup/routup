import type { MethodName } from '../../constants';
import type { RoutupError } from '../../error';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Next } from '../../types';

// todo: add type for DispatcherDefaultEvent | DispatcherErrorEvent ?
//  distinguish by type property ( 'default' | 'error' )
export type DispatcherEvent = {
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
     * The error which occurred during the dispatch process.
     */
    error?: RoutupError,

    /**
     * Signal that the request hasn't been handled.
     * Therefore, the request must be passed to the next handler or router in the chain.
     */
    next: Next,

    // todo: this should maybe be a dynamic getter to the request object.
    /**
     * Indicate if the request has already been dispatched.
     */
    dispatched: boolean,

    /**
     * Ids of chained router instances.
     */
    routerPath: number[],

    /**
     * Collected methods during dispatch process.
     */
    methodsAllowed: string[],
};
