import type { IRoutupEvent } from '../../../event/index.ts';
import { defineCoreHandler } from '../../core/index.ts';
import type { Handler } from '../../module.ts';
import { isWebHandlerProvider } from './is.ts';
import type { WebHandler, WebHandlerProvider } from './types.ts';

/**
 * Create a handler from a Web Fetch API-compatible function or object.
 *
 * Wraps an external app (e.g. Hono, another Router) so it can be mounted
 * via `router.use()`. The original request is passed through as-is.
 *
 * @param input - Fetch function `(request) => Response` or object with a `fetch` method
 *
 * @experimental
 *
 * @example
 * ```ts
 * // Mount an object with a fetch method
 * router.use('/api', fromWebHandler(honoApp));
 *
 * // Mount a plain fetch function
 * router.use('/proxy', fromWebHandler((req) => fetch(req)));
 * ```
 */
export function fromWebHandler(input: WebHandler) : Handler;

export function fromWebHandler(input: WebHandlerProvider) : Handler;

export function fromWebHandler(input: any) : Handler {
    if (isWebHandlerProvider(input)) {
        return fromWebHandler(input.fetch.bind(input));
    }

    return defineCoreHandler({ fn: (event: IRoutupEvent) => input(event.request) });
}
