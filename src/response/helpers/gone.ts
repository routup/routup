import type { IRoutupEvent } from '../../event/index.ts';

export function isResponseGone(event: IRoutupEvent) : boolean {
    return event.dispatched;
}

export function setResponseGone(event: IRoutupEvent) {
    event.dispatched = true;
}
