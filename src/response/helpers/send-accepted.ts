import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { toResponse } from '../to-response.ts';

export function sendAccepted(event: DispatchEvent, data?: unknown) : Response {
    event.response.status = 202;
    event.response.statusText = 'Accepted';
    event.dispatched = true;

    return toResponse(data ?? '', event) as Response;
}
