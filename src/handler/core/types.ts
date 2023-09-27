import type { Request } from '../../request';
import type { Response } from '../../response';
import type { HandlerType } from '../constants';
import type { Next } from '../types';
import type { HandlerConfigBase } from '../types-base';

export type CoreHandler = (
    req: Request,
    res: Response,
    next: Next
) => unknown | Promise<unknown>;

export type CoreHandlerConfig = HandlerConfigBase & {
    type: `${HandlerType.CORE}`,
    fn: CoreHandler
};
