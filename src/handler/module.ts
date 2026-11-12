import { markInstanceof } from '@ebec/core';
import type { MethodName } from '../constants.ts';
import { createError } from '../error/index.ts';
import type { IAppEvent } from '../event/index.ts';
import { toResponse } from '../response/index.ts';
import type { PipelineStep } from '../app/pipeline.ts';
import type { AppOptions } from '../app/types.ts';
import {
    Deadline,
    createTimeoutError,
    isPromise,
    toMethodName,
    withLeadingSlash,
} from '../utils/index.ts';
import { HandlerSymbol, HandlerType } from './constants.ts';
import type { HandlerOptions } from './types.ts';

export class Handler {
    protected config: HandlerOptions;

    readonly method: MethodName | undefined;

    // --------------------------------------------------

    constructor(handler: HandlerOptions) {
        this.config = handler;

        if (typeof handler.path === 'string') {
            this.config.path = withLeadingSlash(handler.path);
        }

        this.method = this.config.method ? toMethodName(this.config.method) : undefined;

        markInstanceof(this, HandlerSymbol);
    }

    // --------------------------------------------------

    get type() {
        return this.config.type;
    }

    get path() {
        return this.config.path;
    }

    // --------------------------------------------------

    /**
     * Run the handler for one step of the match walk. The walk only
     * hands over handlers that fit the error state: an ERROR handler
     * is dispatched while `state.error` is set, a CORE handler while
     * it is not.
     *
     * Resolves with the response, or `undefined` when the handler
     * forwarded a continuation that produced none. A failure is
     * recorded on `state.error` and rethrown.
     */
    async dispatch(step: PipelineStep): Promise<Response | undefined> {
        const { state } = step;

        let response: Response | undefined;
        // Hoisted so the outer catch can forward it to `onError` and
        // so the outer finally can release the deadline even when
        // `onBefore` throws before `deadline.run()`.
        let handlerEvent: IAppEvent | undefined;
        let deadline: Deadline | undefined;

        try {
            const effectiveTimeout = this.resolveTimeout(state.appOptions);

            // When a per-handler timeout is active, the handler's signal
            // is the deadline's: it aborts on timeout and follows the
            // signal of the request.
            if (effectiveTimeout) {
                deadline = new Deadline(effectiveTimeout, state.signal);
            }

            handlerEvent = step.createEvent(deadline?.signal);

            if (this.config.onBefore) {
                await this.config.onBefore(handlerEvent);
            }

            let invocation: unknown;

            if (this.config.type === HandlerType.ERROR) {
                const { fn } = this.config;

                invocation = fn(state.error!, handlerEvent);
            } else {
                const { fn } = this.config;

                invocation = fn(handlerEvent);
            }

            let result: unknown;

            if (deadline) {
                // Race the (possibly-async) invocation against the timeout.
                result = await deadline.run(() => this.resolveHandlerResult(invocation, handlerEvent!));
            } else if (isPromise(invocation)) {
                // Async handler return — await once. If it resolves
                // to undefined, fall back to the async resolver
                // (waits for `next()` or abort).
                const awaited = await invocation;

                result = typeof awaited === 'undefined' ?
                    await this.resolveHandlerResult(undefined, handlerEvent) :
                    awaited;
            } else if (typeof invocation === 'undefined') {
                // Sync undefined: defer to async resolver — handler
                // may invoke `next()` later from a callback.
                result = await this.resolveHandlerResult(undefined, handlerEvent);
            } else {
                // Sync non-undefined: zero internal microtasks.
                result = invocation;
            }

            // `toResponse` returns sync when no ETag is configured —
            // avoid an unconditional `await` to save a microtask.
            const toResp = toResponse(result, handlerEvent);

            response = isPromise(toResp) ?
                await toResp :
                toResp;

            if (response) {
                state.dispatched = true;

                // ERROR handler resolved the pending error — clear it
                // so the fallback does not report a handled error.
                if (this.config.type === HandlerType.ERROR && state.error) {
                    state.error = undefined;
                }
            }

            if (this.config.onAfter) {
                await this.config.onAfter(handlerEvent, response);
            }
        } catch (e) {
            state.error = createError(e);

            // Fire `onError` even if the error came from `onBefore`
            // or `onAfter` — it is the handler-scoped error hook.
            // `step.createEvent()` is the fallback when the throw
            // landed before `handlerEvent` was built.
            if (this.config.onError) {
                try {
                    await this.config.onError(state.error, handlerEvent ?? step.createEvent());
                } catch (innerErr) {
                    state.error = createError(innerErr);
                }
            }

            throw state.error;
        } finally {
            if (deadline) {
                deadline.release();
            }
        }

        return response;
    }

    // --------------------------------------------------

    /**
     * Resolve a handler's return value into the final value handed to `toResponse`.
     *
     * Contract:
     * - non-undefined value → return as-is (becomes the response)
     * - `undefined` + `event.next()` was called → forward downstream result
     * - `undefined` + `event.next()` not yet called → wait until either `next()` is
     *   invoked (e.g. from an async callback) or `signal` aborts. A global or
     *   per-handler timeout aborts `signal` and surfaces as 408. With no timeout
     *   configured and no eventual `next()` call, the request hangs by design.
     */
    protected async resolveHandlerResult(
        invocation: unknown | Promise<unknown>,
        handlerEvent: IAppEvent,
    ): Promise<unknown> {
        const value = await invocation;

        if (typeof value !== 'undefined') {
            return value;
        }

        if (handlerEvent.nextCalled) {
            return handlerEvent.nextResult;
        }

        const { signal } = handlerEvent;

        if (signal.aborted) {
            throw createTimeoutError();
        }

        return new Promise<unknown>((resolve, reject) => {
            const onAbort = () => {
                signal.removeEventListener('abort', onAbort);
                reject(createTimeoutError());
            };

            signal.addEventListener('abort', onAbort, { once: true });

            handlerEvent.whenNextCalled().then(() => {
                signal.removeEventListener('abort', onAbort);
                resolve(handlerEvent.nextResult);
            });
        });
    }

    protected resolveTimeout(appOptions: AppOptions): number | undefined {
        const routerDefault = appOptions.handlerTimeout;
        const handlerOverride = this.config.timeout;

        if (!routerDefault && !handlerOverride) {
            return undefined;
        }

        if (!routerDefault) {
            return handlerOverride;
        }

        if (!handlerOverride) {
            return routerDefault;
        }

        if (appOptions.handlerTimeoutOverridable) {
            return handlerOverride;
        }

        return Math.min(routerDefault, handlerOverride);
    }
}
