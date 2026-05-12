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
     * Returns true if no listeners are registered for any hook name.
     * O(1) check used by the Router fast path to gate skipping the
     * pipeline entirely.
     */
    isEmpty(): boolean;

    clone(): IHooks;

    trigger(
        name: HookName,
        event: IDispatcherEvent,
    ): Promise<void>;
}
