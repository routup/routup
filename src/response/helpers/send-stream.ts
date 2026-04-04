import type { DispatchEvent } from '../../dispatcher/event/module.ts';

export function sendStream(event: DispatchEvent, stream: ReadableStream): Response {
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
