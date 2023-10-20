import type { DispatcherErrorEvent, DispatcherEvent } from '../dispatcher';

export type HookErrorListener = (event: DispatcherErrorEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: DispatcherEvent) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
