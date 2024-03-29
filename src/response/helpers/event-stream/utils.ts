import type { EventStreamMessage } from './types';

export function serializeEventStreamMessage(message: EventStreamMessage): string {
    let result = '';

    if (message.id) {
        result += `id: ${message.id}\n`;
    }

    if (message.event) {
        result += `event: ${message.event}\n`;
    }

    if (
        typeof message.retry === 'number' &&
        Number.isInteger(message.retry)
    ) {
        result += `retry: ${message.retry}\n`;
    }

    result += `data: ${message.data}\n\n`;

    return result;
}
