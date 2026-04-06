import type { IRoutupEvent } from '../../event/index.ts';
import { defineCoreHandler } from '../core/index.ts';
import type { Handler } from '../module';
import { isWebHandlerProvider } from './is.ts';
import type { WebHandler, WebHandlerProvider } from './types.ts';

/**
 * Create a handler from a Web Fetch API-compatible function or object.
 *
 * Wraps an external app (e.g. Hono, another Router) so it can be mounted
 * via `router.use()`. The request URL is adjusted to strip the mount prefix.
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

    return defineCoreHandler({
        fn: async (event: IRoutupEvent) => {
            const url = new URL(event.request.url);
            url.pathname = event.path;

            const adjusted = new Request(url.toString(), event.request);
            return input(adjusted);
        },
    });
}
