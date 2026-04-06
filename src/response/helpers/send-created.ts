import type { IRoutupEvent } from '../../event/index.ts';
import { toResponse } from '../to-response.ts';

export async function sendCreated(event: IRoutupEvent, data?: unknown): Promise<Response> {
    event.response.status = 201;
    event.response.statusText = 'Created';
    event.dispatched = true;

    return await toResponse(data ?? '', event) as Response;
}
