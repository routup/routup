import { HandlerType } from '../constants';
import type {
    CoreHandler,
    CoreHandlerConfig,
} from './types';

export function coreHandler(input: Omit<CoreHandlerConfig, | 'type'>) : CoreHandlerConfig;

export function coreHandler(input: CoreHandler) : CoreHandlerConfig;
export function coreHandler(input: any) : CoreHandlerConfig {
    if (typeof input === 'function') {
        return {
            type: HandlerType.CORE,
            fn: input,
        };
    }
    return {
        type: HandlerType.CORE,
        ...input,
    };
}
