import type { IAppEvent } from '../../event/index.ts';
import { createFastResponse } from '../../utils/response.ts';

export type IterableSerializer = (value: unknown) => Uint8Array | string | undefined;

export type IterableSource = Iterable<unknown> |
AsyncIterable<unknown> |
Iterator<unknown> |
AsyncIterator<unknown> |
(() => Iterator<unknown> | AsyncIterator<unknown>);

export type SendIterableOptions = {
    /**
     * Turn one yielded value into a chunk. Returning `undefined` skips the value.
     */
    serializer?: IterableSerializer;
};

const encoder = new TextEncoder();

function defaultSerializer(value: unknown): Uint8Array | string | undefined {
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
        case 'boolean':
        case 'bigint':
            return String(value);
        case 'object': {
            if (value === null) {
                return 'null';
            }

            if (value instanceof Uint8Array) {
                return value;
            }

            if (ArrayBuffer.isView(value)) {
                return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
            }

            if (value instanceof ArrayBuffer) {
                return new Uint8Array(value);
            }

            return JSON.stringify(value);
        }
        default:
            return undefined;
    }
}

function toIterator(source: IterableSource): Iterator<unknown> | AsyncIterator<unknown> {
    // Object() lets a primitive string stream as its characters
    const src = Object(typeof source === 'function' ? source() : source) as object;

    if (Symbol.asyncIterator in src) {
        return (src as AsyncIterable<unknown>)[Symbol.asyncIterator]();
    }

    if (Symbol.iterator in src) {
        return (src as Iterable<unknown>)[Symbol.iterator]();
    }

    return src as Iterator<unknown> | AsyncIterator<unknown>;
}

/**
 * Whether a handler return value streams as an iterable: an async
 * iterable, or a generator-like iterator. Arrays, strings, typed arrays,
 * `Map` and `Set` are iterable but have no `next()`, so they stay JSON.
 */
export function isStreamableIterable(value: unknown): value is object {
    if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value) ||
        value instanceof Response ||
        value instanceof ReadableStream
    ) {
        return false;
    }

    return Symbol.asyncIterator in value ||
        (Symbol.iterator in value && typeof (value as { next?: unknown }).next === 'function');
}

/**
 * Build the streamed `Response` for an iterable source.
 *
 * The first chunk is pulled before the `Response` exists, so a throw
 * before the first `yield` rejects here and is handled as a normal
 * handler error (and the producer can still set status/headers).
 */
export async function createIterableResponse(
    event: IAppEvent,
    source: IterableSource,
    serializer: IterableSerializer = defaultSerializer,
): Promise<Response> {
    const iterator = toIterator(source);

    // Contained close: neither a throwing nor a rejecting return() escapes.
    const close = () => {
        try {
            Promise.resolve(iterator.return?.()).catch(() => undefined);
        } catch {
            // a throwing return() must not escape the abort listener
        }
    };

    // Resolves the next serialized chunk, skipping values the serializer
    // drops; `undefined` means the source is done.
    const nextChunk = async (): Promise<Uint8Array | undefined> => {
        for (;;) {
            const step = await iterator.next();

            if (step.done) {
                return undefined;
            }

            let chunk: Uint8Array | string | undefined;

            try {
                chunk = serializer(step.value);
            } catch (e) {
                // the iterator is still suspended here; an error of next() itself needs no close
                close();

                throw e;
            }

            if (typeof chunk !== 'undefined') {
                return typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
            }
        }
    };

    // While the first chunk is pending, an abort of the event's signal
    // (handler timeout, client gone) closes the iterator so its `finally` runs.
    const { signal } = event;

    if (signal.aborted) {
        close();
    } else {
        signal.addEventListener('abort', close, { once: true });
    }

    let pending: Uint8Array | undefined;

    try {
        pending = await nextChunk();
    } finally {
        signal.removeEventListener('abort', close);
    }

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            const chunk = pending ?? await nextChunk();

            pending = undefined;

            if (typeof chunk === 'undefined') {
                controller.close();

                return;
            }

            controller.enqueue(chunk);
        },
        async cancel() {
            await iterator.return?.();
        },
    });

    const { status, headers } = event.response;

    return createFastResponse(stream, status, [...headers]);
}

/**
 * Stream an iterable, async iterable, iterator or generator to the client.
 * One value is serialized per chunk; no default `Content-Type` is set.
 */
export function sendIterable(
    event: IAppEvent,
    source: IterableSource,
    options: SendIterableOptions = {},
): Promise<Response> {
    return createIterableResponse(event, source, options.serializer);
}
