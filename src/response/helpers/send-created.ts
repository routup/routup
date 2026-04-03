import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { toResponse } from '../to-response.ts';

export function sendCreated(event: DispatchEvent, data?: unknown) : Response {
    event.response.status = 201;
    event.response.statusText = 'Created';
    event.dispatched = true;

    return toResponse(data ?? '', event) as Response;
}
