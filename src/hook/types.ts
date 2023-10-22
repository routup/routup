import type { DispatchErrorEvent, DispatchEvent } from '../dispatcher';

export type HookErrorListener = (event: DispatchErrorEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: DispatchEvent) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
