import { MethodName } from '../../constants';
import type { RoutupError } from '../../error';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Next } from '../../types';
import { nextPlaceholder } from '../../utils';
import type { DispatchEventCreateContext } from './types';

export class DispatchEvent {
    /**
     * Request Object.
     */
    request: Request;

    /**
     * Response Object.
     */
    response: Response;

    /**
     * Params collected during execution.
     */
    params: Record<string, any>;

    /**
     * Request path.
     */
    path: string;

    /**
     * HTTP Method used for the request.
     */
    method: `${MethodName}`;

    /**
     * The relative path on which the router is hung.
     */
    mountPath: string;

    /**
     * The error which occurred during the dispatch process.
     */
    error?: RoutupError;

    /**
     * Signal that the request hasn't been handled.
     * Therefore, the request must be passed to the next handler or router in the chain.
     */
    next: Next;

    /**
     * Indicate if the request has already been dispatched/send.
     */
    protected _dispatched: boolean;

    /**
     * Ids of chained router instances.
     */
    routerPath: number[];

    /**
     * Collected methods during dispatch process.
     */
    methodsAllowed: string[];

    constructor(context: DispatchEventCreateContext) {
        this.request = context.request;
        this.response = context.response;

        this.method = context.method || MethodName.GET;
        this.methodsAllowed = [];
        this.mountPath = '/';
        this.params = {};
        this.path = context.path || '/';
        this.routerPath = [];
        this.next = nextPlaceholder;
    }

    get dispatched() {
        return this._dispatched || this.response.writableEnded || this.response.headersSent;
    }

    set dispatched(value: boolean) {
        this._dispatched = value;
    }
}
