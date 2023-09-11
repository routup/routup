import type { NodeRequest, NodeResponse } from '../bridge';

export interface Dispatcher {
    dispatch(
        event: DispatcherEvent,
        meta: DispatcherMeta,
        done: DispatcherNext,
    ) : Promise<any>;
}

/**
 * Callback fn to call the next item on the stack.
 */
export type DispatcherNext = (err?: Error) => Promise<any>;

export type DispatcherMeta = {
    /**
     * Params collected on path.
     */
    params?: Record<string, any>,

    /**
     * Path to check for the current instance.
     */
    path?: string,

    /**
     * The relative path on which the router is hung.
     */
    mountPath?: string,

    /**
     * The error which occurred during a previous handler.
     */
    error?: Error,

    /**
     * Amount of seconds before a handler should expire.
     */
    timeout?: number
};

export type DispatcherEvent = {
    req: NodeRequest,
    res: NodeResponse,
};
