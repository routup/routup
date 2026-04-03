import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import type { RoutupError } from '../../error/module.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseConfig } from '../types-base.ts';

export type ErrorHandlerFn = (
    error: RoutupError,
    event: DispatchEvent,
) => Response | Promise<Response> | void | Promise<void>;

export type ErrorHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.ERROR}`,
    fn: ErrorHandlerFn
};
