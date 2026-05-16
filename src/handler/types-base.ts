import type { MethodName } from '../constants.ts';
import type { AppError } from '../error/index.ts';
import type { IAppEvent } from '../event/index.ts';
import type { Path } from '../path/index.ts';

/**
 * Side-effect callback fired before the handler's `fn` is invoked.
 * Receives the same `AppEvent` the handler will see. Throwing here is
 * equivalent to the handler throwing — `onError` (if set) fires next
 * and the error propagates to the surrounding error chain. Return
 * value is ignored; if you need to short-circuit, use middleware.
 */
export type HandlerBeforeListener = (event: IAppEvent) => unknown | Promise<unknown>;

/**
 * Side-effect callback fired after the handler's `fn` returns and
 * `toResponse` builds the final response. Receives the same
 * `AppEvent` `fn` saw plus the produced `Response` (`undefined` when
 * the handler did not produce a response). Throwing here is treated
 * like the handler throwing.
 */
export type HandlerAfterListener = (event: IAppEvent, response: Response | undefined) => unknown | Promise<unknown>;

/**
 * Side-effect callback fired when the handler's `fn` (or `onBefore`)
 * throws. Receives the resolved `AppError` and the handler's event.
 * Throwing here replaces `event.error` with the new error before the
 * pipeline observes it; returning normally lets the original error
 * propagate.
 */
export type HandlerErrorListener = (error: AppError, event: IAppEvent) => unknown | Promise<unknown>;

export type HandlerBaseOptions = {
    method?: Uppercase<MethodName> | Lowercase<MethodName>,
    path?: Path,

    /**
     * Per-handler timeout in milliseconds.
     *
     * Overrides the router's `handlerTimeout` default. Whether this value
     * can extend or only narrow the default is controlled by the router's
     * `handlerTimeoutOverridable` option.
     */
    timeout?: number,

    /**
     * Instrumentation hook fired before `fn` is invoked. Plain
     * optional callback — no event-name dispatch, no priorities;
     * for cross-handler instrumentation, prefer middleware.
     */
    onBefore?: HandlerBeforeListener,

    /**
     * Instrumentation hook fired after the response is built (or
     * the handler resolved without one). Receives `(event, response)`.
     */
    onAfter?: HandlerAfterListener,

    /**
     * Instrumentation hook fired when `fn` (or `onBefore`) throws.
     * Receives `(error, event)`. Re-throwing replaces the active
     * `event.error`; returning normally lets the original error
     * propagate.
     */
    onError?: HandlerErrorListener,
};
