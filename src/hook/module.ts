import type { DispatchEvent } from '../dispatcher';
import { dispatch, isDispatcherErrorEvent } from '../dispatcher';
import type { RoutupError } from '../error';

import { nextPlaceholder } from '../utils';
import { HookName } from './constants';
import type {
    HookDefaultListener, HookErrorListener, HookListener, HookUnsubscribeFn,
} from './types';

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
        event: DispatchEvent,
    ) : Promise<void> {
        if (!this.items[name] || this.items[name].length === 0) {
            return;
        }

        try {
            for (let i = 0; i < this.items[name].length; i++) {
                const hook = this.items[name][i] as HookDefaultListener;

                event.dispatched = await dispatch(
                    event,
                    (next) => Promise.resolve()
                        .then(() => {
                            event.next = next;
                            return this.triggerListener(name, event, hook);
                        })
                        .catch((err) => next(err)),
                );

                event.next = nextPlaceholder;

                if (event.dispatched) {
                    if (event.error) {
                        event.error = undefined;
                    }

                    return;
                }
            }
        } catch (e) {
            event.error = e as RoutupError;

            if (!this.isErrorListenerHook(name)) {
                await this.trigger(
                    HookName.ERROR,
                    event,
                );

                if (event.dispatched) {
                    if (event.error) {
                        event.error = undefined;
                    }
                }
            }
        }
    }

    private triggerListener(name: `${HookName}`, event: DispatchEvent, listener: HookListener) {
        if (this.isErrorListenerHook(name)) {
            if (isDispatcherErrorEvent(event)) {
                return (listener as HookErrorListener)(event);
            }

            return undefined;
        }

        return (listener as HookDefaultListener)(event);
    }

    private isErrorListenerHook(input: `${HookName}`) {
        return input === HookName.ERROR ||
            input === HookName.DISPATCH_FAIL;
    }
}
