import { MethodName } from '../constants.ts';
import type { DispatchEvent, Dispatcher } from '../dispatcher/index.ts';
import { createError, isError } from '../error/index.ts';
import { HookManager, HookName } from '../hook/index.ts';
import type { Path } from '../path/index.ts';
import { PathMatcher } from '../path/index.ts';
import { toResponse } from '../response/to-response.ts';
import { toMethodName, withLeadingSlash } from '../utils/index.ts';
import { HandlerSymbol, HandlerType } from './constants.ts';
import type { HandlerConfig } from './types.ts';

export class Handler implements Dispatcher {
    readonly '@instanceof' = HandlerSymbol;

    protected config: HandlerConfig;

    protected hookManager: HookManager;

    protected pathMatcher: PathMatcher | undefined;

    protected _method: MethodName | undefined;

    // --------------------------------------------------

    constructor(handler: HandlerConfig) {
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

    async dispatch(event: DispatchEvent): Promise<Response | undefined> {
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

            if (this.config.type === HandlerType.ERROR) {
                if (event.error) {
                    result = await this.config.fn(event.error, event);
                }
            } else {
                result = await this.config.fn(event);
            }

            response = toResponse(result, event);

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
