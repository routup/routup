import { HandlerType } from '../constants.ts';
import { Handler } from '../module.ts';
import type {
    ErrorHandler,
    ErrorHandlerOptions,
} from './types.ts';

/**
 * Create an error handler.
 *
 * Error handlers receive errors thrown by preceding handlers in the pipeline.
 *
 * @param input - Handler function `(error, event) => value` or options object `{ fn, path? }`
 *
 * @example
 * ```typescript
 * router.use(defineErrorHandler((error, event) => {
 *     return { message: error.message };
 * }));
 * ```
 */
export function defineErrorHandler(input: Omit<ErrorHandlerOptions, 'type'>) : Handler;

export function defineErrorHandler(input: ErrorHandler) : Handler;
export function defineErrorHandler(input: any) : Handler {
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
