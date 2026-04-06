import type { IRoutupEvent } from '../../event/index.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseOptions } from '../types-base.ts';

export type CoreHandler = (
    event: IRoutupEvent,
) => unknown | Promise<unknown>;

export type CoreHandlerOptions = HandlerBaseOptions & {
    type: `${HandlerType.CORE}`,
    fn: CoreHandler
};
