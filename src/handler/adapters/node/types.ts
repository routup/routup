import type { IncomingMessage, ServerResponse } from 'node:http';

export type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown | Promise<unknown>;
export type NodeMiddleware = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => unknown | Promise<unknown>;
