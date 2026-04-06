import { HeaderName } from '../../../constants.ts';
import type { IRoutupEvent } from '../../../event/index.ts';
import { RoutupError } from '../../../error/module.ts';
import type { EventStreamMessage } from './types.ts';
import { serializeEventStreamMessage } from './utils.ts';

export type EventStreamOptions = {
    maxMessageSize?: number,
};

export type EventStreamHandle = {
    write(message: string | EventStreamMessage): void;
    end(): void;
    response: Response;
};

export function createEventStream(
    event: IRoutupEvent,
    options?: EventStreamOptions,
): EventStreamHandle {
    if (options?.maxMessageSize !== undefined) {
        if (!Number.isInteger(options.maxMessageSize) || options.maxMessageSize < 0) {
            throw new RoutupError('maxMessageSize must be a non-negative integer.');
        }
    }

    let controller: ReadableStreamDefaultController<Uint8Array>;
    let closed = false;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
            controller = ctrl;
        },
        cancel() {
            closed = true;
        },
    });

    const headers = new Headers(event.response.headers);
    headers.set(HeaderName.CONTENT_TYPE, 'text/event-stream');
    headers.set(HeaderName.CACHE_CONTROL, 'private, no-cache, no-store, no-transform, must-revalidate, max-age=0');
    headers.set(HeaderName.X_ACCEL_BUFFERING, 'no');
    headers.set(HeaderName.CONNECTION, 'keep-alive');

    const response = new Response(stream, {
        status: event.response.status,
        statusText: event.response.statusText,
        headers,
    });

    const handle: EventStreamHandle = {
        write(message: string | EventStreamMessage): void {
            if (closed) return;

            if (typeof message === 'string') {
                handle.write({ data: message });
                return;
            }

            const serialized = serializeEventStreamMessage(message);

            if (options?.maxMessageSize !== undefined) {
                const serializedSize = encoder.encode(serialized).byteLength;
                if (serializedSize > options.maxMessageSize) {
                    return;
                }
            }

            controller.enqueue(encoder.encode(serialized));
        },

        end(): void {
            if (closed) return;

            closed = true;
            controller.close();
        },

        response,
    };

    return handle;
}
