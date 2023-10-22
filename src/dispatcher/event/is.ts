import type { DispatcherErrorEvent } from './error';
import type { DispatcherEvent } from './module';

export function isDispatcherErrorEvent(
    event: DispatcherEvent | DispatcherErrorEvent,
) : event is DispatcherErrorEvent {
    return typeof event.error !== 'undefined';
}
