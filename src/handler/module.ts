import { MethodName } from '../constants.ts';
import type { IDispatcher, IDispatcherEvent } from '../dispatcher/index.ts';
import { createError, isError } from '../error/index.ts';
import { HookManager, HookName } from '../hook/index.ts';
import type { Path } from '../path/index.ts';
import { PathMatcher } from '../path/index.ts';
import { toResponse } from '../response/index.ts';
import type { RouterOptions } from '../router/types.ts';
import { toMethodName, withLeadingSlash } from '../utils/index.ts';
import { HandlerSymbol, HandlerType } from './constants.ts';
import type { HandlerOptions } from './types.ts';

export class Handler implements IDispatcher {
    readonly '@instanceof' = HandlerSymbol;

    protected config: HandlerOptions;

    protected hookManager: HookManager;

    protected pathMatcher: PathMatcher | undefined;

    protected _method: MethodName | undefined;

    // --------------------------------------------------

    constructor(handler: HandlerOptions) {
        this.config = handler;
        this.hookManager = new HookManager();

        this.mountHooks();
        this.setPath(handler.path);
    }

    // --------------------------------------------------

    get type() {
        return this.config.type;
    }

    get path() {
        return this.config.path;
    }

    get method() {
        if (this._method || !this.config.method) {
            return this._method;
        }

        this._method = toMethodName(this.config.method);
        return this._method;
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
            const handlerEvent = event.build();

            if (this.config.type === HandlerType.ERROR) {
                if (event.error) {
                    const { fn } = this.config;
                    const { error } = event;
                    result = await this.executeWithTimeout(
                        () => fn(error, handlerEvent),
                        handlerEvent.routerOptions,
                    );
                }
            } else {
                const { fn } = this.config;
                result = await this.executeWithTimeout(
                    () => fn(handlerEvent),
                    handlerEvent.routerOptions,
                );
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

    setPath(path?: Path): void {
        if (typeof path === 'string') {
            path = withLeadingSlash(path);
        }

        this.config.path = path;

        if (typeof path === 'undefined') {
            this.pathMatcher = undefined;
            return;
        }

        this.pathMatcher = new PathMatcher(path, { end: !!this.config.method });
    }

    // --------------------------------------------------

    matchMethod(method: `${MethodName}`): boolean {
        return !this.method ||
            method === this.method ||
            (
                method === MethodName.HEAD &&
                this.method === MethodName.GET
            );
    }

    setMethod(input?: `${MethodName}`): void {
        const method = toMethodName(input);

        this.config.method = method;
        this._method = method;
    }

    // --------------------------------------------------

    protected async executeWithTimeout(
        fn: () => unknown | Promise<unknown>,
        routerOptions: RouterOptions,
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
                        reject(createError({
                            statusCode: 408,
                            statusMessage: 'Request Timeout',
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
