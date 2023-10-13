import type { DispatcherMatch } from '../dispatcher';
import type { ErrorProxy } from '../error';
import type { Next } from '../handler';
import type { Request } from '../request';
import type { Response } from '../response';

export type HookErrorListener = (
    error: ErrorProxy,
    req: Request,
    res: Response,
    next: Next
) => Promise<unknown> | unknown;

export type HookDefaultListener = (
    req: Request,
    res: Response,
    next: Next
) => Promise<unknown> | unknown;

export type HookMatchListener = (
    match: DispatcherMatch,
    req: Request,
    res: Response,
    next: Next
) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener |
HookDefaultListener |
HookMatchListener;
