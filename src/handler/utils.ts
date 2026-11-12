import type { MethodName } from '../constants.ts';
import { matchesRouteMethod } from '../utils/method-rule.ts';

/**
 * Match a request method against a handler's bound method.
 *
 * - When the handler has no method bound, matches every request method.
 * - Otherwise matches when the request method is the same.
 * - HEAD requests additionally match GET handlers.
 *
 * The rule lives in `src/utils/method-rule.ts`.
 */
export function matchHandlerMethod(
    handlerMethod: MethodName | undefined,
    requestMethod: MethodName,
): boolean {
    return matchesRouteMethod(handlerMethod, requestMethod);
}
