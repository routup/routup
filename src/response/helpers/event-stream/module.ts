import { HeaderName } from '../../../constants.ts';
import type { IAppEvent } from '../../../event/index.ts';
import { AppError } from '../../../error/module.ts';
import type { EventStreamMessage } from './types.ts';
import { serializeEventStreamComment, serializeEventStreamMessage } from './utils.ts';

export type EventStreamOptions = {
    maxMessageSize?: number,
};

export type EventStreamHandle = {
    write(message: string | EventStreamMessage): boolean;
    /**
     * Write a comment line. Clients ignore it, so it can be used
     * as a keep-alive ping.
     */
    writeComment(comment: string): boolean;
    end(): void;
    response: Response;
};

export function createEventStream(
    event: IAppEvent,
    options?: EventStreamOptions,
): EventStreamHandle {
    if (options?.maxMessageSize !== undefined) {
        if (!Number.isSafeInteger(options.maxMessageSize) || options.maxMessageSize < 0) {
            throw new AppError('maxMessageSize must be a non-negative integer.');
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
        headers,
    });

    const enqueue = (serialized: string): boolean => {
        if (closed) {
            return false;
        }

        const chunk = encoder.encode(serialized);

        if (
            options?.maxMessageSize !== undefined &&
            chunk.byteLength > options.maxMessageSize
        ) {
            return false;
        }

        controller.enqueue(chunk);

        return true;
    };

    const handle: EventStreamHandle = {
        write(message: string | EventStreamMessage): boolean {
            if (typeof message === 'string') {
                return enqueue(serializeEventStreamMessage({ data: message }));
            }

            return enqueue(serializeEventStreamMessage(message));
        },

        writeComment(comment: string): boolean {
            return enqueue(serializeEventStreamComment(comment));
        },

        end(): void {
            if (closed) {
                return;
            }

            closed = true;
            controller.close();
        },

        response,
    };

    return handle;
}
