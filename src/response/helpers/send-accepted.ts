import type { IRoutupEvent } from '../../event/index.ts';
import { toResponse } from '../to-response.ts';

export async function sendAccepted(event: IRoutupEvent, data?: unknown): Promise<Response> {
    event.response.status = 202;
    event.response.statusText = 'Accepted';
    event.dispatched = true;

    return await toResponse(data ?? '', event) as Response;
}
