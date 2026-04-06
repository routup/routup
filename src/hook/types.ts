import type { IRoutupEvent } from '../event/index.ts';

export type HookErrorListener = (event: IRoutupEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: IRoutupEvent) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
