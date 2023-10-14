import { dispatch } from '../dispatcher';
import type { DispatcherEvent } from '../dispatcher';
import { createError } from '../error';

import { nextPlaceholder } from '../utils';
import { HookName } from './constants';
import type {
    HookDefaultListener,
    HookErrorListener, HookListener, HookMatchListener, HookUnsubscribeFn,
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
    ) : HookUnsubscribeFn {
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

        if (this.items[name].length === 0) {
            delete this.items[name];
        }
    }

    // --------------------------------------------------

    /**
     * @throws RoutupError
     *
     * @param name
     * @param event
     */
    async trigger(
        name: `${HookName}`,
        event: DispatcherEvent,
    ) : Promise<boolean> {
        if (!this.items[name] || this.items[name].length === 0) {
            return false;
        }

        let dispatched = false;

        try {
            for (let i = 0; i < this.items[name].length; i++) {
                const hook = this.items[name][i] as HookDefaultListener;

                dispatched = await dispatch(
                    event,
                    (next) => Promise.resolve()
                        .then(() => {
                            event.next = next;
                            return this.triggerListener(name, event, hook);
                        })
                        .catch((err) => next(err)),
                );

                event.next = nextPlaceholder;

                if (dispatched) {
                    event.error = undefined;
                    return true;
                }
            }
        } catch (e) {
            const error = createError(e);

            if (!isHookForErrorListener(name)) {
                event.error = error;

                const dispatched = await this.trigger(
                    HookName.ERROR,
                    event,
                );

                if (dispatched) {
                    event.error = undefined;
                    return true;
                }

                throw error;
            }

            throw error;
        }

        return false;
    }

    private triggerListener(name: `${HookName}`, event: DispatcherEvent, listener: HookListener) {
        if (isHookForMatchListener(name)) {
            if (event.match) {
                return (listener as HookMatchListener)(event.match, event.request, event.response, event.next);
            }

            return undefined;
        }

        if (isHookForErrorListener(name)) {
            if (event.error) {
                return (listener as HookErrorListener)(event.error, event.request, event.response, event.next);
            }

            return undefined;
        }

        return (listener as HookDefaultListener)(event.request, event.response, event.next);
    }
}
