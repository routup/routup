import type { IncomingMessage, ServerResponse } from 'node:http';

export interface NodeResponse extends ServerResponse {

}

export interface NodeRequest extends IncomingMessage {

}

export type NodeNext = (err?: Error) => void;

export type NodeHandler = (
    req: NodeRequest,
    res: NodeResponse,
    next: NodeNext
) => unknown;

export type NodeErrorHandler = (
    err: Error,
    req: NodeRequest,
    res: NodeResponse,
    next: NodeNext
) => unknown;
