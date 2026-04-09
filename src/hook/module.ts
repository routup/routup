import type { IDispatcherEvent } from '../dispatcher/types.ts';
import { createError } from '../error/create.ts';
import { HookName } from './constants.ts';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
    HookUnsubscribeFn,
} from './types.ts';

export class HookManager {
    protected items: Record<string, HookListener[]>;

    // --------------------------------------------------

    constructor() {
        this.items = {};
    }

    // --------------------------------------------------

    addListener(
        name: `${HookName}`,
        fn: HookListener,
    ): HookUnsubscribeFn {
        this.items[name] = this.items[name] || [];
        this.items[name].push(fn);

        return () => {
            this.removeListener(name, fn);
        };
    }

    removeListener(name: `${HookName}`): void;

    removeListener(name: `${HookName}`, fn: HookListener): void;

    removeListener(name: `${HookName}`, fn?: HookListener): void {
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

    async trigger(
        name: `${HookName}`,
        event: IDispatcherEvent,
    ): Promise<void> {
        if (!this.items[name] || this.items[name].length === 0) {
            return;
        }

        try {
            for (let i = 0; i < this.items[name].length; i++) {
                const listener = this.items[name][i]!;
                await this.triggerListener(name, event, listener);

                if (event.dispatched) {
                    if (event.error) {
                        event.error = undefined;
                    }
                    return;
                }
            }
        } catch (e) {
            if (!event.error) {
                event.error = createError(e);
            }

            if (!this.isErrorListenerHook(name)) {
                await this.trigger(HookName.ERROR, event);

                if (event.dispatched) {
                    if (event.error) {
                        event.error = undefined;
                    }
                }
            }
        }
    }

    private triggerListener(name: `${HookName}`, event: IDispatcherEvent, listener: HookListener) {
        if (this.isErrorListenerHook(name)) {
            if (event.error) {
                return (listener as HookErrorListener)(event);
            }
            return undefined;
        }

        return (listener as HookDefaultListener)(event);
    }

    private isErrorListenerHook(input: `${HookName}`) {
        return input === HookName.ERROR;
    }
}
