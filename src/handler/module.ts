import { MethodName } from '../constants';
import type { Dispatcher, DispatcherEvent } from '../dispatcher';
import { dispatch, mergeDispatcherMetaParams } from '../dispatcher';
import { isError } from '../error';
import { HookManager, HookName } from '../hook';
import type { Path } from '../path';
import { PathMatcher } from '../path';
import { HandlerSymbol, HandlerType } from './constants';
import type { HandlerConfig } from './types';

export class Handler implements Dispatcher {
    readonly '@instanceof' = HandlerSymbol;

    readonly config: HandlerConfig;

    protected hookManager : HookManager;

    protected pathMatcher: PathMatcher | undefined;

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
        return this.config.method ?
            this.config.method.toLowerCase() :
            undefined;
    }

    // --------------------------------------------------

    async dispatch(event: DispatcherEvent): Promise<boolean> {
        if (this.pathMatcher) {
            const pathMatch = this.pathMatcher.exec(event.meta.path);
            if (pathMatch) {
                event.meta.params = mergeDispatcherMetaParams(event.meta.params, pathMatch.params);
            }
        }

        let dispatched : boolean;

        dispatched = await this.hookManager.callEventHook(HookName.HANDLER_BEFORE, event);
        if (dispatched) {
            return true;
        }

        try {
            dispatched = await dispatch(event, (done) => {
                if (this.config.type === HandlerType.ERROR) {
                    if (event.meta.error) {
                        return this.config.fn(event.meta.error, event.req, event.res, done);
                    }
                } else {
                    return this.config.fn(event.req, event.res, done);
                }

                return undefined;
            });
        } catch (e) {
            if (isError(e)) {
                dispatched = await this.hookManager.callErrorHook(HookName.ERROR, event, e);

                if (!dispatched) {
                    throw e;
                }
            }
        }

        return (await this.hookManager.callEventHook(HookName.HANDLER_AFTER, event)) || dispatched;
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

    matchMethod(method: string): boolean {
        if (!this.method) {
            return true;
        }

        const name = method.toLowerCase();
        if (name === this.method) {
            return true;
        }

        return name === MethodName.HEAD &&
            this.method === MethodName.GET;
    }

    setMethod(method?: `${MethodName}`) : void {
        this.config.method = method;
    }

    // --------------------------------------------------

    protected mountHooks() {
        if (this.config.onBefore) {
            this.hookManager.addListener(HookName.HANDLER_BEFORE, this.config.onBefore);
        }

        if (this.config.onAfter) {
            this.hookManager.addListener(HookName.HANDLER_AFTER, this.config.onAfter);
        }

        if (this.config.onError) {
            this.hookManager.addListener(HookName.ERROR, this.config.onError);
        }
    }
}
