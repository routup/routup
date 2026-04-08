import type { IDispatcherEvent } from '../dispatcher/types.ts';

export type HookErrorListener = (event: IDispatcherEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: IDispatcherEvent) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
