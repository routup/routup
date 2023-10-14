import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Next } from '../../types';
import type { HandlerType } from '../constants';
import type { HandlerBaseConfig } from '../types-base';

export type CoreHandlerFn = (
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type CoreHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.CORE}`,
    fn: CoreHandlerFn
};
