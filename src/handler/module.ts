import { markInstanceof } from '@ebec/core';
import type { MethodName } from '../constants.ts';
import type { IDispatcher, IDispatcherEvent } from '../dispatcher/index.ts';
import { createError, isError } from '../error/index.ts';
import type { IAppEvent } from '../event/index.ts';
import { toResponse } from '../response/index.ts';
import type { AppOptions } from '../app/types.ts';
import { isPromise, toMethodName, withLeadingSlash } from '../utils/index.ts';
import { HandlerSymbol, HandlerType } from './constants.ts';
import type { HandlerOptions } from './types.ts';

export class Handler implements IDispatcher {
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

    async dispatch(event: IDispatcherEvent): Promise<Response | undefined> {
        let response: Response | undefined;
        // Hoisted so the outer catch can forward it to `onError`. We
        // keep the no-throw common path allocation-free by lazily
        // assigning inside the try.
        let handlerEvent: IAppEvent | undefined;

        try {
            // Read router options directly from the dispatcher event so we
            // can decide on the per-handler timeout without first wrapping
            // into a AppEvent — saves a `build()` allocation on the
            // common no-timeout path.
            const effectiveTimeout = this.resolveTimeout(event.appOptions);

            // When a per-handler timeout is active, create a child AbortController
            // linked to the parent signal so the handler's signal aborts on timeout
            let childController: AbortController | undefined;
            let cleanupParentListener: (() => void) | undefined;

            if (effectiveTimeout) {
                const parentSignal = event.signal;
                childController = new AbortController();

                if (parentSignal.aborted) {
                    childController.abort(parentSignal.reason);
                } else {
                    const onAbort = () => childController!.abort(parentSignal.reason);
                    parentSignal.addEventListener('abort', onAbort, { once: true });
                    cleanupParentListener = () => parentSignal.removeEventListener('abort', onAbort);
                }
            }

            // Build the handler event exactly once — with the child signal
            // when a timeout is configured, otherwise inheriting the
            // dispatcher's own signal.
            handlerEvent = childController ?
                event.build(childController.signal) :
                event.build();

            // ERROR handlers with no pending error are a no-op — and
            // the onBefore/onAfter callbacks are too (no `fn` ran, so
            // there's nothing to bracket).
            const skipFn = this.config.type === HandlerType.ERROR && !event.error;

            if (!skipFn && this.config.onBefore) {
                await this.config.onBefore(handlerEvent);
            }

            let result: unknown;

            try {
                // Invoke the handler fn inside the cleanup-protected
                // try so a sync throw still releases the parent abort
                // listener registered above.
                let invocation: unknown;
                if (skipFn) {
                    // result stays undefined; falls through to toResponse(undefined) → undefined.
                } else if (this.config.type === HandlerType.ERROR) {
                    const { fn } = this.config;
                    invocation = fn(event.error!, handlerEvent);
                } else {
                    const { fn } = this.config;
                    invocation = fn(handlerEvent);
                }

                if (skipFn) {
                    // no-op
                } else if (effectiveTimeout) {
                    // Race the (possibly-async) invocation against the timeout.
                    result = await this.executeWithTimeout(
                        () => this.resolveHandlerResult(invocation, handlerEvent!),
                        effectiveTimeout,
                        childController,
                    );
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
            } finally {
                if (cleanupParentListener) {
                    cleanupParentListener();
                }
            }

            // `toResponse` returns sync when no ETag is configured —
            // avoid an unconditional `await` to save a microtask.
            const toResp = toResponse(result, handlerEvent);
            response = isPromise(toResp) ?
                await toResp :
                toResp;

            if (response) {
                event.dispatched = true;
                // ERROR handler resolved the pending error — clear it
                // so parent pipelines don't observe a stale error.
                if (this.config.type === HandlerType.ERROR && event.error) {
                    event.error = undefined;
                }
            }

            if (!skipFn && this.config.onAfter) {
                await this.config.onAfter(handlerEvent, response);
            }
        } catch (e) {
            event.error = isError(e) ? e : createError(e);

            // Fire `onError` even if the error came from `onBefore`
            // or `onAfter` — it is the handler-scoped error hook.
            // `event.build()` is the fallback when the throw landed
            // before we built `handlerEvent`.
            if (this.config.onError) {
                try {
                    await this.config.onError(event.error, handlerEvent ?? event.build());
                } catch (innerErr) {
                    event.error = isError(innerErr) ? innerErr : createError(innerErr);
                }
            }

            throw event.error;
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
            throw createError({ status: 408, message: 'Request Timeout' });
        }

        return new Promise<unknown>((resolve, reject) => {
            const onAbort = () => {
                signal.removeEventListener('abort', onAbort);
                reject(createError({
                    status: 408,
                    message: 'Request Timeout',
                }));
            };

            signal.addEventListener('abort', onAbort, { once: true });

            handlerEvent.whenNextCalled().then(() => {
                signal.removeEventListener('abort', onAbort);
                resolve(handlerEvent.nextResult);
            });
        });
    }

    protected async executeWithTimeout(
        fn: () => unknown | Promise<unknown>,
        effectiveTimeout: number | undefined,
        controller?: AbortController,
    ): Promise<unknown> {
        if (!effectiveTimeout) {
            return fn();
        }

        let timerId: ReturnType<typeof setTimeout> | undefined;

        try {
            return await Promise.race([
                fn(),
                new Promise<never>((_, reject) => {
                    timerId = setTimeout(() => {
                        if (controller) {
                            controller.abort();
                        }
                        reject(createError({
                            status: 408,
                            message: 'Request Timeout',
                        }));
                    }, effectiveTimeout);
                }),
            ]);
        } finally {
            clearTimeout(timerId);
        }
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
