import type { IRoutupEvent } from '../../event/index.ts';
import type { RoutupError } from '../../error/module.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseConfig } from '../types-base.ts';

export type ErrorHandlerFn = (
    error: RoutupError,
    event: IRoutupEvent,
) => unknown | Promise<unknown>;

export type ErrorHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.ERROR}`,
    fn: ErrorHandlerFn
};
