import type { RoutupError } from '../error';
import type { Request } from '../request';
import type { Response } from '../response';
import type { Next } from '../types';

export type HookErrorListener = (
    error: RoutupError,
    req: Request,
    res: Response,
    next: Next
) => Promise<unknown> | unknown;

export type HookDefaultListener = (
    req: Request,
    res: Response,
    next: Next
) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
