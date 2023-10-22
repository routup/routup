import type { DispatchErrorEvent } from './error';
import type { DispatchEvent } from './module';

export function isDispatcherErrorEvent(
    event: DispatchEvent | DispatchErrorEvent,
) : event is DispatchErrorEvent {
    return typeof event.error !== 'undefined';
}
