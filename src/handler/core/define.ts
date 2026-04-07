import { HandlerType } from '../constants.ts';
import { Handler } from '../module.ts';
import type {
    CoreHandler,
    CoreHandlerOptions,
} from './types.ts';

/**
 * Create a request handler.
 *
 * @param input - Handler function `(event) => value` or options object `{ fn, path?, method? }`
 *
 * @example
 * ```typescript
 * // Shorthand — function only
 * router.get('/', defineCoreHandler((event) => 'Hello'));
 *
 * // Verbose — with path and method
 * router.use(defineCoreHandler({
 *     path: '/users/:id',
 *     method: 'GET',
 *     fn: (event) => ({ id: event.params.id }),
 * }));
 * ```
 */
export function defineCoreHandler(input: Omit<CoreHandlerOptions, | 'type'>) : Handler;

export function defineCoreHandler(input: CoreHandler) : Handler;

export function defineCoreHandler(input: any) : Handler {
    if (typeof input === 'function') {
        return new Handler({
            type: HandlerType.CORE,
            fn: input,
        });
    }

    return new Handler({
        type: HandlerType.CORE,
        ...input,
    });
}
