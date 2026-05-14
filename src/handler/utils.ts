import { MethodName } from '../constants.ts';

/**
 * Match a request method against a handler's bound method.
 *
 * - When the handler has no method bound, matches every request method.
 * - Otherwise matches when the request method is the same.
 * - HEAD requests additionally match GET handlers.
 */
export function matchHandlerMethod(
    handlerMethod: MethodName | undefined,
    requestMethod: MethodName,
): boolean {
    return !handlerMethod ||
        requestMethod === handlerMethod ||
        (requestMethod === MethodName.HEAD && handlerMethod === MethodName.GET);
}
