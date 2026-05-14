import type { IAppEvent } from '../../event/index.ts';
import { toResponse } from '../to-response.ts';

export async function sendCreated(event: IAppEvent, data?: unknown): Promise<Response> {
    event.response.status = 201;

    return await toResponse(data ?? '', event) as Response;
}
