import type { DispatchEvent } from '../dispatcher/event/module.ts';

export type HookErrorListener = (event: DispatchEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: DispatchEvent) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
