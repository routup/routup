import type { ErrorProxy } from '../../error';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { HandlerType } from '../constants';
import type { Next } from '../types';
import type { HandlerBaseConfig } from '../types-base';

export type ErrorHandlerFn = (
    err: ErrorProxy,
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type ErrorHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.ERROR}`,
    fn: ErrorHandlerFn
};
