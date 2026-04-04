import type { RoutupError } from '../../error/module.ts';
import type { DispatchEvent } from './module.ts';

export function isDispatchErrorEvent(
    event: DispatchEvent,
): boolean {
    return typeof event.error !== 'undefined';
}

export type { RoutupError };
