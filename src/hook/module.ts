import { dispatch } from '../dispatcher';
import type { DispatcherEvent } from '../dispatcher';
import { createError } from '../error';
import type { Next } from '../handler';
import { HookName } from './constants';
import type {
    HookDefaultListener,
    HookErrorListener, HookListener, HookListenerUnsubscribe, HookMatchListener,
} from './types';
import { isHookForErrorListener, isHookForMatchListener } from './utils';

export class HookManager {
    protected items : Record<string, HookListener[]>;

    // --------------------------------------------------

    constructor() {
        this.items = {};
    }

    // --------------------------------------------------

    addListener(
        name: `${HookName}`,
        fn: HookListener,
    ) : HookListenerUnsubscribe {
        this.items[name] = this.items[name] || [];
        this.items[name].push(fn);

        return () => {
            this.removeListener(name, fn);
        };
    }

    removeListener(name: `${HookName}`) : void;

    removeListener(name: `${HookName}`, fn: HookListener) : void;

    removeListener(name: `${HookName}`, fn?: HookListener) : void {
        if (!this.items[name]) {
            return;
        }

        if (typeof fn === 'undefined') {
            delete this.items[name];
            return;
        }

        if (typeof fn === 'function') {
            const index = this.items[name].indexOf(fn);
            if (index !== -1) {
                this.items[name].splice(index, 1);
            }
        }
    }

    // --------------------------------------------------

    /**
     * @throws ErrorProxy
     *
     * @param name
     * @param event
     */
    async trigger(
        name: `${HookName}`,
        event: DispatcherEvent,
    ) : Promise<boolean> {
        const items = this.items[name] || [];
        if (items.length === 0) {
            return false;
        }

        let dispatched = false;

        let triggerListener : (listener: HookListener, next: Next) => unknown;
        if (isHookForMatchListener(name)) {
            triggerListener = (listener, next) => {
                if (event.match) {
                    return (listener as HookMatchListener)(event.match, event.req, event.res, next);
                }

                return undefined;
            };
        } else if (isHookForErrorListener(name)) {
            triggerListener = (listener, next) => {
                if (event.meta.error) {
                    return (listener as HookErrorListener)(event.meta.error, event.req, event.res, next);
                }

                return undefined;
            };
        } else {
            triggerListener = (
                listener,
                next,
            ) => (listener as HookDefaultListener)(event.req, event.res, next);
        }

        try {
            for (let i = 0; i < items.length; i++) {
                const hook = items[i] as HookDefaultListener;

                dispatched = await dispatch(
                    event,
                    (next) => Promise.resolve()
                        .then(() => triggerListener(hook, next))
                        .catch((err) => next(err)),
                );

                if (dispatched) {
                    event.meta.error = undefined;
                    return true;
                }
            }
        } catch (e) {
            const error = createError(e);

            if (!isHookForErrorListener(name)) {
                event.meta.error = error;

                const dispatched = await this.trigger(
                    HookName.ERROR,
                    event,
                );

                if (dispatched) {
                    event.meta.error = undefined;
                    return true;
                }

                throw error;
            }

            throw error;
        }

        return false;
    }
}
