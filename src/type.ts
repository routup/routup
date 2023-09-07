import type { IncomingMessage, ServerResponse } from 'node:http';

export interface NodeResponse extends ServerResponse {

}

export interface NodeRequest extends IncomingMessage {

}

export type Next = (err?: Error) => void;

// --------------------------------------------------

export type NodeHandler = (
    req: NodeRequest,
    res: NodeResponse,
    next: Next
) => unknown;

export type NodeErrorHandler = (
    err: Error,
    req: NodeRequest,
    res: NodeResponse,
    next: Next
) => unknown;

// --------------------------------------------------

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
    mountPath?: string
};
