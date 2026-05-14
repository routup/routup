import type { IAppEvent } from '../../event/index.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseOptions } from '../types-base.ts';

export type CoreHandler = (
    event: IAppEvent,
) => unknown | Promise<unknown>;

export type CoreHandlerOptions = HandlerBaseOptions & {
    type: typeof HandlerType.CORE,
    fn: CoreHandler
};
