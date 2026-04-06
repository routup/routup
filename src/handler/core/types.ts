import type { IRoutupEvent } from '../../event/index.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseConfig } from '../types-base.ts';

export type CoreHandlerFn = (
    event: IRoutupEvent,
) => unknown | Promise<unknown>;

export type CoreHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.CORE}`,
    fn: CoreHandlerFn
};
