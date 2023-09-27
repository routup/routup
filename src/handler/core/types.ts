import type { Request } from '../../request';
import type { Response } from '../../response';
import type { HandlerType } from '../constants';
import type { Next } from '../types';
import type { HandlerBase } from '../types-base';

export type CoreHandlerFn = (
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type CoreHandler = HandlerBase & {
    type: `${HandlerType.CORE}`,
    fn: CoreHandlerFn
};
