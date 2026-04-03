import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { toResponse } from '../to-response.ts';

export async function sendAccepted(event: DispatchEvent, data?: unknown): Promise<Response> {
    event.response.status = 202;
    event.response.statusText = 'Accepted';
    event.dispatched = true;

    return await toResponse(data ?? '', event) as Response;
}
