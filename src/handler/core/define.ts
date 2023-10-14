import { HandlerType } from '../constants';
import type {
    CoreHandlerConfig,
    CoreHandlerFn,
} from './types';

export function coreHandler(input: Omit<CoreHandlerConfig, | 'type'>) : CoreHandlerConfig;

export function coreHandler(input: CoreHandlerFn) : CoreHandlerConfig;
export function coreHandler(input: any) : CoreHandlerConfig {
    if (typeof input === 'function') {
        // todo: create Handler
        return {
            type: HandlerType.CORE,
            fn: input,
        };
    }

    // todo: create Handler
    return {
        type: HandlerType.CORE,
        ...input,
    };
}
