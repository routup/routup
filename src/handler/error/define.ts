import { HandlerType } from '../constants';
import type {
    ErrorHandler,
    ErrorHandlerConfig,
} from './types';

export function errorHandler(input: Omit<ErrorHandlerConfig, 'type'>) : ErrorHandlerConfig;

export function errorHandler(input: ErrorHandler) : ErrorHandlerConfig;
export function errorHandler(input: any) : ErrorHandlerConfig {
    if (typeof input === 'function') {
        return {
            type: HandlerType.ERROR,
            fn: input,
        };
    }

    return {
        type: HandlerType.ERROR,
        ...input,
    };
}
