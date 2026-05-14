import type { IAppEvent } from '../../event/index.ts';
import type { AppError } from '../../error/module.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseOptions } from '../types-base.ts';

export type ErrorHandler = (
    error: AppError,
    event: IAppEvent,
) => unknown | Promise<unknown>;

export type ErrorHandlerOptions = HandlerBaseOptions & {
    type: typeof HandlerType.ERROR,
    fn: ErrorHandler
};
