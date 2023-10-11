import type { DispatcherEvent } from '../dispatcher';
import type { ErrorProxy } from '../error';
import type { HandlerMatch } from '../handler';
import type { RouterMatch } from '../router';

// todo: change event and error argument position?
export type HookErrorFn = (event: DispatcherEvent, error: ErrorProxy) => Promise<unknown> | unknown;
export type HookEventFn = (event: DispatcherEvent) => Promise<unknown> | unknown;
// todo: change event and match argument position?
export type HookMatchFn = (event: DispatcherEvent, match: RouterMatch | HandlerMatch) => Promise<unknown> | unknown;

export type HookFn = HookErrorFn | HookEventFn | HookMatchFn;
