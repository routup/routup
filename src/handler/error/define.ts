import { HandlerType } from '../constants';
import type {
    ErrorHandler,
    ErrorHandlerFn,
} from './types';

export function errorHandler(input: Omit<ErrorHandler, 'type'>) : ErrorHandler;

export function errorHandler(input: ErrorHandlerFn) : ErrorHandler;
export function errorHandler(input: any) : ErrorHandler {
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
