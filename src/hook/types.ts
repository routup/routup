import type { DispatcherEvent } from '../dispatcher';
import type { ErrorProxy } from '../error';
import type { Layer } from '../layer';
import type { Router } from '../router';

export type HookErrorFn = (event: DispatcherEvent, input: ErrorProxy) => Promise<unknown> | unknown;
export type HookEventFn = (event: DispatcherEvent) => Promise<unknown> | unknown;
export type HookMatchFn = (element: Layer | Router) => Promise<unknown> | unknown;

export type HookFn = HookErrorFn | HookEventFn | HookMatchFn;
