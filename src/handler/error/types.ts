import type { IRoutupEvent } from '../../event/index.ts';
import type { RoutupError } from '../../error/module.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseOptions } from '../types-base.ts';

export type ErrorHandler = (
    error: RoutupError,
    event: IRoutupEvent,
) => unknown | Promise<unknown>;

export type ErrorHandlerOptions = HandlerBaseOptions & {
    type: `${HandlerType.ERROR}`,
    fn: ErrorHandler
};
