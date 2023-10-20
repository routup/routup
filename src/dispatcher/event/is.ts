import type { DispatcherErrorEvent, DispatcherEvent } from './types';

export function isDispatcherErrorEvent(event: DispatcherEvent | DispatcherErrorEvent) : event is DispatcherErrorEvent {
    return typeof event.error !== 'undefined';
}
