import type { ErrorProxy } from '../../error';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { HandlerType } from '../constants';
import type { Next } from '../types';
import type { HandlerConfigBase } from '../types-base';

export type ErrorHandler = (
    err: ErrorProxy,
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type ErrorHandlerConfig = HandlerConfigBase & {
    type: `${HandlerType.ERROR}`,
    fn: ErrorHandler
};
