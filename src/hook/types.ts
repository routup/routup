import type { DispatcherEvent } from '../dispatcher';
import type { ErrorProxy } from '../error';
import type { HandlerMatch, Next } from '../handler';
import type { RouterMatch } from '../router';

// todo: change event and error argument position?
export type HookErrorListener = (
    error: ErrorProxy,
    event: DispatcherEvent,
    next: Next
) => Promise<unknown> | unknown;

export type HookEventListener = (
    event: DispatcherEvent,
    next: Next
) => Promise<unknown> | unknown;

// todo: change event and match argument position?
export type HookMatchListener = (
    match: RouterMatch | HandlerMatch,
    event: DispatcherEvent,
    next: Next
) => Promise<unknown> | unknown;

export type HookListener = HookErrorListener |
HookEventListener |
HookMatchListener;
