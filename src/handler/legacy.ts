import type { RoutupError } from '../error/module.ts';
import type { Request } from '../request/types.ts';
import type { Response } from '../response/types.ts';
import type { Next } from '../types.ts';
import type { HandlerType } from './constants.ts';
import type { HandlerBaseConfig } from './types-base.ts';

export type LegacyCoreHandlerFn = (
    req: Request,
    res: Response,
    next: Next,
) => unknown | Promise<unknown>;

export type LegacyCoreHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.CORE}`,
    fn: LegacyCoreHandlerFn
};

export type LegacyErrorHandlerFn = (
    err: RoutupError,
    req: Request,
    res: Response,
    next: Next,
) => unknown | Promise<unknown>;

export type LegacyErrorHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.ERROR}`,
    fn: LegacyErrorHandlerFn
};

export type LegacyHandlerConfig = LegacyCoreHandlerConfig | LegacyErrorHandlerConfig;
export type LegacyHandlerFn = LegacyCoreHandlerFn | LegacyErrorHandlerFn;
