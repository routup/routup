import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { toResponse } from '../to-response.ts';

export async function sendCreated(event: DispatchEvent, data?: unknown): Promise<Response> {
    event.response.status = 201;
    event.response.statusText = 'Created';
    event.dispatched = true;

    return await toResponse(data ?? '', event) as Response;
}
