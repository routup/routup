import type { EventStreamMessage } from './types.ts';

function stripNewlines(value: string) : string {
    return value.replace(/[\r\n]/g, '');
}

export function serializeEventStreamMessage(message: EventStreamMessage): string {
    let result = '';

    if (message.id) {
        result += `id: ${stripNewlines(message.id)}\n`;
    }

    if (message.event) {
        result += `event: ${stripNewlines(message.event)}\n`;
    }

    if (
        typeof message.retry === 'number' &&
        Number.isInteger(message.retry)
    ) {
        result += `retry: ${message.retry}\n`;
    }

    const lines = message.data.replace(/\r/g, '').split('\n');
    for (const line of lines) {
        result += `data: ${line}\n`;
    }
    result += '\n';

    return result;
}
