import { markInstanceof } from '@ebec/core';
import type { MethodName } from '../constants.ts';
import type { IDispatcher, IDispatcherEvent } from '../dispatcher/index.ts';
import { createError, isError } from '../error/index.ts';
import type { IRoutupEvent } from '../event/index.ts';
import { HookManager, HookName } from '../hook/index.ts';
import type { PathMatcher } from '../path/index.ts';
import { toResponse } from '../response/index.ts';
import type { RouterOptions } from '../router/types.ts';
import { toMethodName, withLeadingSlash } from '../utils/index.ts';
import { HandlerSymbol, HandlerType } from './constants.ts';
import type { HandlerOptions } from './types.ts';
import { buildHandlerPathMatcher } from './utils.ts';

export class Handler implements IDispatcher {
    protected config: HandlerOptions;

    protected hookManager: HookManager;

    protected pathMatcher: PathMatcher | undefined;

    readonly method: MethodName | undefined;

    // --------------------------------------------------

    constructor(handler: HandlerOptions) {
        this.config = handler;
        this.hookManager = new HookManager();

        this.mountHooks();

        if (typeof handler.path === 'string') {
            this.config.path = withLeadingSlash(handler.path);
        }

        this.pathMatcher = buildHandlerPathMatcher(this.config.path, !!this.config.method);
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
        if (this.pathMatcher) {
            const pathMatch = this.pathMatcher.exec(event.path);
            if (pathMatch) {
                event.params = {
                    ...event.params,
                    ...pathMatch.params,
                };
            }
        }

        await this.hookManager.trigger(HookName.CHILD_DISPATCH_BEFORE, event);
        if (event.dispatched) {
            return undefined;
        }

        let response: Response | undefined;

        try {
            let result: unknown;

            // Build a preliminary event to access routerOptions for timeout resolution
            const previewEvent = event.build();
            const effectiveTimeout = this.resolveTimeout(previewEvent.routerOptions);

            // When a per-handler timeout is active, create a child AbortController
            // linked to the parent signal so the handler's signal aborts on timeout
            let childController: AbortController | undefined;
            let cleanupParentListener: (() => void) | undefined;
            let handlerEvent = previewEvent;

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

                // Rebuild with the child signal so the handler sees it via event.signal
                handlerEvent = event.build(childController.signal);
            }

            try {
                if (this.config.type === HandlerType.ERROR) {
                    if (event.error) {
                        const { fn } = this.config;
                        const { error } = event;
                        result = await this.executeWithTimeout(
                            () => this.resolveHandlerResult(
                                fn(error, handlerEvent),
                                handlerEvent,
                            ),
                            handlerEvent.routerOptions,
                            childController,
                        );
                    }
                } else {
                    const { fn } = this.config;
                    result = await this.executeWithTimeout(
                        () => this.resolveHandlerResult(
                            fn(handlerEvent),
                            handlerEvent,
                        ),
                        handlerEvent.routerOptions,
                        childController,
                    );
                }
            } finally {
                if (cleanupParentListener) {
                    cleanupParentListener();
                }
            }

            response = await toResponse(result, handlerEvent);

            if (response) {
                event.dispatched = true;
            }
        } catch (e) {
            event.error = isError(e) ? e : createError(e);

            await this.hookManager.trigger(HookName.ERROR, event);

            if (event.dispatched) {
                event.error = undefined;
            } else {
                throw event.error;
            }
        }

        await this.hookManager.trigger(HookName.CHILD_DISPATCH_AFTER, event);

        return response;
    }

    // --------------------------------------------------

    matchPath(path: string): boolean {
        if (!this.pathMatcher) {
            return true;
        }

        return this.pathMatcher.test(path);
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
        handlerEvent: IRoutupEvent,
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
        routerOptions: RouterOptions,
        controller?: AbortController,
    ): Promise<unknown> {
        const effectiveTimeout = this.resolveTimeout(routerOptions);

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

    protected resolveTimeout(routerOptions: RouterOptions): number | undefined {
        const routerDefault = routerOptions.handlerTimeout;
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

        if (routerOptions.handlerTimeoutOverridable) {
            return handlerOverride;
        }

        return Math.min(routerDefault, handlerOverride);
    }

    protected mountHooks() {
        if (this.config.onBefore) {
            this.hookManager.addListener(HookName.CHILD_DISPATCH_BEFORE, this.config.onBefore);
        }

        if (this.config.onAfter) {
            this.hookManager.addListener(HookName.CHILD_DISPATCH_AFTER, this.config.onAfter);
        }

        if (this.config.onError) {
            this.hookManager.addListener(HookName.ERROR, this.config.onError);
        }
    }
}
