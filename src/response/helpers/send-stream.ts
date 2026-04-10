import type { IRoutupEvent } from '../../event/index.ts';

export function sendStream(event: IRoutupEvent, stream: ReadableStream): Response {
    const {
        status,
        headers,
    } = event.response;

    return new Response(stream, {
        status,
        headers,
    });
}
