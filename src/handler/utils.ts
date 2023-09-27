import { HandlerType } from './constants';
import { isCoreHandler } from './core';
import { isHandlerConfig } from './is';
import type { Handler, HandlerConfig } from './types';
import type { HandlerConfigBase } from './types-base';

export function toHandlerConfig(
    input: Handler | HandlerConfig,
    base?: HandlerConfigBase,
): HandlerConfig {
    if (isHandlerConfig(input)) {
        return {
            ...input,
            ...(base || {}),
        };
    }

    if (isCoreHandler(input)) {
        return {
            type: HandlerType.CORE,
            fn: input,
            ...(base || {}),
        };
    }

    return {
        type: HandlerType.ERROR,
        fn: input,
        ...(base || {}),
    };
}
