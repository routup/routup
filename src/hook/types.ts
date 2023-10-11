import type { DispatcherEvent } from '../dispatcher';
import type { ErrorProxy } from '../error';
import type { HandlerMatch } from '../handler';
import type { RouterMatch } from '../router';

// todo: change event and error argument position?
export type HookErrorListener = (event: DispatcherEvent, error: ErrorProxy) => Promise<unknown> | unknown;
export type HookEventListener = (event: DispatcherEvent) => Promise<unknown> | unknown;
// todo: change event and match argument position?
export type HookMatchListener = (event: DispatcherEvent, match: RouterMatch | HandlerMatch) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener |
HookEventListener |
HookMatchListener;
