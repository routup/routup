import type { IAppEvent } from '../../event/index.ts';

export function getRequestHeader(
    event: IAppEvent,
    name: string,
) : string | null {
    return event.headers.get(name);
}
