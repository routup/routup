import { dispatch } from '../dispatcher';
import type { DispatcherEvent } from '../dispatcher';
import type { ErrorProxy } from '../error';
import { createError } from '../error';
import type { HandlerMatch } from '../handler';
import type { RouterMatch } from '../router';
import { HookName } from './constants';
import type {
    HookErrorListener, HookEventListener, HookListener, HookMatchListener,
} from './types';

export class HookManager {
    protected items : Record<string, (undefined | HookListener)[]>;

    constructor() {
        this.items = {};
    }

    addListener(name: `${HookName}`, fn: HookListener) : number {
        this.items[name] = this.items[name] || [];
        this.items[name].push(fn);

        return this.items[name].length - 1;
    }

    removeListener(name: `${HookName}`) : void;

    removeListener(name: `${HookName}`, fn: HookListener | number) : void;

    removeListener(name: `${HookName}`, fn?: HookListener | number) : void {
        if (!this.items[name]) {
            return;
        }

        if (typeof fn === 'undefined') {
            delete this.items[name];
            return;
        }

        if (typeof fn === 'number') {
            this.items[name][fn] = undefined;
            return;
        }

        if (typeof fn === 'function') {
            const index = this.items[name].indexOf(fn);
            if (index !== -1) {
                this.items[name][index] = undefined;
            }
        }
    }

    async triggerMatchHook(
        event: DispatcherEvent,
        match: RouterMatch | HandlerMatch,
    ) : Promise<boolean> {
        const items = this.items[HookName.MATCH] || [];
        if (items.length === 0) {
            return false;
        }

        let dispatched = false;

        try {
            for (let i = 0; i < items.length; i++) {
                const hook = items[i] as HookMatchListener;
                if (!hook) {
                    continue;
                }

                dispatched = await dispatch(event, (next) => {
                    Promise.resolve()
                        .then(() => hook(match, event, next))
                        .then((r) => r)
                        .catch((err) => next(err));
                });

                if (dispatched) {
                    return true;
                }
            }
        } catch (e) {
            const error = createError(e);

            const dispatched = await this.triggerErrorHook(
                HookName.ERROR,
                event,
                error,
            );

            if (dispatched) {
                return true;
            }

            throw error;
        }

        return false;
    }

    /**
     * @throws ErrorProxy
     *
     * @param name
     * @param event
     */
    async triggerEventHook(
        name: `${HookName}`,
        event: DispatcherEvent,
    ) : Promise<boolean> {
        const items = this.items[name] || [];
        if (items.length === 0) {
            return false;
        }

        let dispatched = false;

        try {
            for (let i = 0; i < items.length; i++) {
                const hook = items[i] as HookEventListener;
                if (!hook) {
                    continue;
                }

                dispatched = await dispatch(event, (next) => {
                    Promise.resolve()
                        .then(() => hook(event, next))
                        .then((r) => r)
                        .catch((err) => next(err));
                });

                if (dispatched) {
                    return true;
                }
            }
        } catch (e) {
            const error = createError(e);

            const dispatched = await this.triggerErrorHook(
                HookName.ERROR,
                event,
                error,
            );

            if (dispatched) {
                return true;
            }

            throw error;
        }

        return false;
    }

    async triggerErrorHook(
        name: `${HookName.DISPATCH_FAIL}` | `${HookName.ERROR}`,
        event: DispatcherEvent,
        input: ErrorProxy,
    ) : Promise<boolean> {
        const items = (this.items[name] || []) as HookErrorListener[];
        if (items.length === 0) {
            return false;
        }

        let dispatched = false;

        for (let i = 0; i < items.length; i++) {
            const hook = items[i];
            if (!hook) {
                continue;
            }

            dispatched = await dispatch(event, (next) => Promise.resolve()
                .then(() => hook(input, event, next))
                .then((r) => r)
                .catch((err) => next(err)));

            if (dispatched) {
                return true;
            }
        }

        return false;
    }
}
