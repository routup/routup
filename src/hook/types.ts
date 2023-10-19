import type { RoutingErrorEvent, RoutingEvent } from '../event';

export type HookErrorListener = (event: RoutingErrorEvent) => Promise<unknown> | unknown;
export type HookDefaultListener = (event: RoutingEvent | RoutingErrorEvent) => Promise<unknown> | unknown;
export type HookListener = HookErrorListener | HookDefaultListener;

export type HookUnsubscribeFn = () => void;
