import { HeaderName } from '../../../constants.ts';
import type { DispatchEvent } from '../../../dispatcher/event/module.ts';
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
    event: DispatchEvent,
    options?: EventStreamOptions,
): EventStreamHandle {
    if (options?.maxMessageSize !== undefined) {
        if (!Number.isInteger(options.maxMessageSize) || options.maxMessageSize < 0) {
            throw new TypeError('maxMessageSize must be a non-negative integer.');
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

    const headers = new Headers({
        [HeaderName.CONTENT_TYPE]: 'text/event-stream',
        [HeaderName.CACHE_CONTROL]: 'private, no-cache, no-store, no-transform, must-revalidate, max-age=0',
        [HeaderName.X_ACCEL_BUFFERING]: 'no',
        [HeaderName.CONNECTION]: 'keep-alive',
    });

    const response = new Response(stream, {
        status: 200,
        headers,
    });

    event.dispatched = true;

    const handle: EventStreamHandle = {
        write(message: string | EventStreamMessage): void {
            if (closed) return;

            if (typeof message === 'string') {
                handle.write({ data: message });
                return;
            }

            const serialized = serializeEventStreamMessage(message);

            if (options?.maxMessageSize) {
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
