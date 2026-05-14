import type { IAppEvent } from '../../event/index.ts';

export function sendStream(event: IAppEvent, stream: ReadableStream): Response {
    const {
        status,
        headers,
    } = event.response;

    return new Response(stream, {
        status,
        headers,
    });
}
