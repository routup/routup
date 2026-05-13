import type { IDispatcherEvent } from '../dispatcher/types.ts';
import type { HookName } from './constants.ts';

export type HookErrorListener = (event: IDispatcherEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: IDispatcherEvent) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;

export interface IHooks {
    addListener(
        name: HookName,
        fn: HookListener,
        priority?: number,
    ): HookUnsubscribeFn;

    removeListener(name: HookName): void;

    removeListener(name: HookName, fn: HookListener): void;

    removeListener(name: HookName, fn?: HookListener): void;

    /**
     * Returns true if at least one listener is registered for the given
     * hook name. Used by the dispatch pipeline to skip the
     * `await trigger(...)` microtask hop on the hot path when nothing
     * is listening.
     */
    hasListeners(name: HookName): boolean;

    clone(): IHooks;

    trigger(
        name: HookName,
        event: IDispatcherEvent,
    ): Promise<void>;
}
