import type { DispatchEvent } from '../../dispatcher/event/module.ts';

export function isResponseGone(event: DispatchEvent) : boolean {
    return event.dispatched;
}

export function setResponseGone(event: DispatchEvent) {
    event.dispatched = true;
}
