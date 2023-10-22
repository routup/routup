import { MethodName } from '../constants';
import type { DispatchEvent, Dispatcher } from '../dispatcher';
import { dispatch } from '../dispatcher';
import { isError } from '../error';
import { HookManager, HookName } from '../hook';
import type { Path } from '../path';
import { PathMatcher } from '../path';
import { toMethodName } from '../utils';
import { HandlerSymbol, HandlerType } from './constants';
import type { HandlerConfig } from './types';

export class Handler implements Dispatcher {
    readonly '@instanceof' = HandlerSymbol;

    protected config: HandlerConfig;

    protected hookManager : HookManager;

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

    async dispatch(event: DispatchEvent): Promise<void> {
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
            return Promise.resolve();
        }

        try {
            event.dispatched = await dispatch(event, (done) => {
                if (this.config.type === HandlerType.ERROR) {
                    if (event.error) {
                        return this.config.fn(event.error, event.request, event.response, done);
                    }
                } else {
                    return this.config.fn(event.request, event.response, done);
                }

                return undefined;
            });
        } catch (e) {
            if (isError(e)) {
                event.error = e;

                await this.hookManager.trigger(HookName.ERROR, event);

                if (event.dispatched) {
                    event.error = undefined;
                } else {
                    throw e;
                }
            }
        }

        return this.hookManager.trigger(HookName.CHILD_DISPATCH_AFTER, event);
    }

    // --------------------------------------------------

    matchPath(path: string): boolean {
        if (!this.pathMatcher) {
            return true;
        }

        return this.pathMatcher.test(path);
    }

    setPath(path?: Path) : void {
        this.config.path = path;

        if (typeof path === 'undefined') {
            this.pathMatcher = undefined;
            return;
        }

        this.pathMatcher = new PathMatcher(path, {
            end: !!this.config.method,
        });
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

    setMethod(input?: `${MethodName}`) : void {
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
