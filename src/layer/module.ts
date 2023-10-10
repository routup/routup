import { MethodName } from '../constants';
import { mergeDispatcherMetaParams } from '../dispatcher';
import type {
    Dispatcher, DispatcherEvent,
} from '../dispatcher';
import type { Handler } from '../handler';
import { dispatchToHandler } from '../handler';
import { PathMatcher } from '../path';
import { LayerSymbol } from './constants';

export class Layer implements Dispatcher {
    readonly '@instanceof' = LayerSymbol;

    protected handler : Handler;

    protected pathMatcher : PathMatcher | undefined;

    // --------------------------------------------------

    constructor(handler: Handler) {
        this.handler = handler;

        if (handler.path) {
            this.pathMatcher = new PathMatcher(handler.path, {
                end: !!handler.method,
            });
        }
    }

    // --------------------------------------------------

    get type() {
        return this.handler.type;
    }

    get path() {
        return this.handler.path;
    }

    get method() {
        return this.handler.method ?
            this.handler.method.toLowerCase() :
            undefined;
    }

    // --------------------------------------------------

    dispatch(
        event: DispatcherEvent,
    ) : Promise<boolean> {
        if (this.pathMatcher) {
            const pathMatch = this.pathMatcher.exec(event.meta.path);
            if (pathMatch) {
                event.meta.params = mergeDispatcherMetaParams(event.meta.params, pathMatch.params);
            }
        }

        return dispatchToHandler(event, this.handler);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        if (!this.pathMatcher) {
            return true;
        }

        return this.pathMatcher.test(path);
    }

    matchMethod(method: string) : boolean {
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
}
