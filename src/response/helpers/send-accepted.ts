import type { IAppEvent } from '../../event/index.ts';
import { toResponse } from '../to-response.ts';

export async function sendAccepted(event: IAppEvent, data?: unknown): Promise<Response> {
    event.response.status = 202;

    return await toResponse(data ?? '', event) as Response;
}
