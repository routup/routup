import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import type { HandlerType } from '../constants.ts';
import type { HandlerBaseConfig } from '../types-base.ts';

export type CoreHandlerFn = (
    event: DispatchEvent,
) => Response | Promise<Response> | void | Promise<void>;

export type CoreHandlerConfig = HandlerBaseConfig & {
    type: `${HandlerType.CORE}`,
    fn: CoreHandlerFn
};
