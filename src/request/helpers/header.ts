import type { DispatchEvent } from '../../dispatcher/event/module.ts';

export function getRequestHeader(
    event: DispatchEvent,
    name: string,
) : string | null {
    return event.headers.get(name);
}
