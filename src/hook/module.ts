import type { IDispatcherEvent } from '../dispatcher/types.ts';
import { createError } from '../error/create.ts';
import { HookName } from './constants.ts';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
    HookUnsubscribeFn,
    IHooks,
} from './types.ts';

type HookEntry = {
    fn: HookListener;
    priority: number;
};

export class Hooks implements IHooks {
    protected items: Record<string, HookEntry[]>;

    // --------------------------------------------------

    constructor() {
        this.items = {};
    }

    // --------------------------------------------------

    hasListeners(name: HookName): boolean {
        return this.items[name] !== undefined;
    }

    addListener(
        name: HookName,
        fn: HookListener,
        priority: number = 0,
    ): HookUnsubscribeFn {
        this.items[name] = this.items[name] || [];

        const entry: HookEntry = { fn, priority };

        // Insert in sorted position (higher priority first)
        let i = 0;
        while (i < this.items[name].length && this.items[name][i]!.priority >= priority) {
            i++;
        }
        this.items[name].splice(i, 0, entry);

        return () => {
            this.removeListener(name, fn);
        };
    }

    removeListener(name: HookName): void;

    removeListener(name: HookName, fn: HookListener): void;

    removeListener(name: HookName, fn?: HookListener): void {
        if (!this.items[name]) {
            return;
        }

        if (typeof fn === 'undefined') {
            delete this.items[name];
            return;
        }

        if (typeof fn === 'function') {
            const index = this.items[name].findIndex((entry) => entry.fn === fn);
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
     * Create a new `Hooks` instance seeded with the same listeners as this
     * one.
     *
     * Listener functions are shared by reference; priority and ordering are
     * preserved. Future mutations on the returned instance do not affect this
     * one (and vice versa).
     */
    clone(): IHooks {
        const next = new Hooks();
        const names = Object.keys(this.items);
        for (const name of names) {
            const entries = this.items[name]!;
            for (const entry of entries) {
                next.addListener(name as HookName, entry.fn, entry.priority);
            }
        }
        return next;
    }

    // --------------------------------------------------

    async trigger(
        name: HookName,
        event: IDispatcherEvent,
    ): Promise<void> {
        if (!this.items[name] || this.items[name].length === 0) {
            return;
        }

        try {
            for (let i = 0; i < this.items[name].length; i++) {
                const { fn } = this.items[name][i]!;
                await this.triggerListener(name, event, fn);

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

    private triggerListener(name: HookName, event: IDispatcherEvent, listener: HookListener) {
        if (this.isErrorListenerHook(name)) {
            if (event.error) {
                return (listener as HookErrorListener)(event);
            }
            return undefined;
        }

        return (listener as HookDefaultListener)(event);
    }

    private isErrorListenerHook(input: HookName) {
        return input === HookName.ERROR;
    }
}
