import { HandlerType } from '../constants';
import { Handler } from '../module';
import type {
    ErrorHandlerConfig,
    ErrorHandlerFn,
} from './types';

export function errorHandler(input: Omit<ErrorHandlerConfig, 'type'>) : Handler;

export function errorHandler(input: ErrorHandlerFn) : Handler;
export function errorHandler(input: any) : Handler {
    if (typeof input === 'function') {
        return new Handler({
            type: HandlerType.ERROR,
            fn: input,
        });
    }

    return new Handler({
        type: HandlerType.ERROR,
        ...input,
    });
}
