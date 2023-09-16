import type { Request } from '../request';
import type { Response } from '../response';

export type Next = (err?: Error) => void;

export type Handler = (
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type ErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;
