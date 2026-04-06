import type { IRoutupEvent } from '../../event/index.ts';

export function sendStream(event: IRoutupEvent, stream: ReadableStream): Response {
    event.dispatched = true;

    const {
        status,
        statusText,
        headers,
    } = event.response;

    return new Response(stream, {
        status,
        statusText,
        headers,
    });
}
