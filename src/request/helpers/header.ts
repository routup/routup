import type { IRoutupEvent } from '../../event/index.ts';

export function getRequestHeader(
    event: IRoutupEvent,
    name: string,
) : string | null {
    return event.headers.get(name);
}
