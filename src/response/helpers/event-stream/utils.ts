import type { EventStreamMessage } from './types.ts';

function stripNewlines(value: string) : string {
    return value.replace(/[\r\n]/g, '');
}

/**
 * The event stream format treats CRLF, a lone CR and a lone LF as line breaks.
 */
function splitLines(value: string) : string[] {
    return value.split(/\r\n|\r|\n/);
}

/**
 * Serialize a comment. Clients ignore comments, which makes them
 * suitable as keep-alive pings.
 */
export function serializeEventStreamComment(comment: string): string {
    let result = '';

    for (const line of splitLines(comment)) {
        result += `: ${line}\n`;
    }

    result += '\n';

    return result;
}

export function serializeEventStreamMessage(message: EventStreamMessage): string {
    let result = '';

    // An empty id is meaningful: it resets the client's last event ID.
    if (typeof message.id === 'string') {
        result += `id: ${stripNewlines(message.id)}\n`;
    }

    if (message.event) {
        result += `event: ${stripNewlines(message.event)}\n`;
    }

    if (
        typeof message.retry === 'number' &&
        Number.isSafeInteger(message.retry)
    ) {
        result += `retry: ${message.retry}\n`;
    }

    const lines = splitLines(message.data);

    for (const line of lines) {
        result += `data: ${line}\n`;
    }

    result += '\n';

    return result;
}
