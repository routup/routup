import type { IAppEvent } from '../event/index.ts';
import { createFastResponse } from '../utils/response.ts';
import type { IterableSerializer, IterableSource } from './helpers/send-iterable.ts';

const encoder = new TextEncoder();

const settledResponses = new WeakMap<Response, Promise<void>>();

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

type IterableCandidate = {
    [Symbol.asyncIterator]?: unknown,
    [Symbol.iterator]?: unknown,
};

function getIteratorMethod(value: object): (() => Iterator<unknown> | AsyncIterator<unknown>) | undefined {
    const candidate = value as IterableCandidate;
    const asyncMethod = candidate[Symbol.asyncIterator];

    if (typeof asyncMethod === 'function') {
        return asyncMethod as () => AsyncIterator<unknown>;
    }

    const syncMethod = candidate[Symbol.iterator];

    if (typeof syncMethod === 'function') {
        return syncMethod as () => Iterator<unknown>;
    }

    return undefined;
}

function toIterator(source: IterableSource): Iterator<unknown> | AsyncIterator<unknown> {
    let src: object;

    if (typeof source === 'function' && !getIteratorMethod(source)) {
        // a plain function is a factory
        src = Object(source());
    } else {
        // Object() lets a primitive string stream as its characters
        src = Object(source);
    }

    const method = getIteratorMethod(src);

    if (method) {
        return method.call(src);
    }

    return src as Iterator<unknown> | AsyncIterator<unknown>;
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

    let settle!: () => void;
    const settled = new Promise<void>((resolve) => {
        settle = resolve;
    });

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            let chunk: Uint8Array | undefined;

            try {
                chunk = pending ?? await nextChunk();
            } catch (e) {
                settle();

                throw e;
            }

            pending = undefined;

            if (typeof chunk === 'undefined') {
                controller.close();
                settle();

                return;
            }

            controller.enqueue(chunk);
        },
        async cancel() {
            try {
                await iterator.return?.();
            } finally {
                settle();
            }
        },
    });

    const { status, headers } = event.response;
    const response = createFastResponse(stream, status, [...headers]);

    settledResponses.set(response, settled);

    return response;
}

/**
 * The promise that resolves once the stream of a response built by
 * `createIterableResponse()` completed, errored or was cancelled;
 * `undefined` for any other response.
 */
export function whenIterableResponseSettled(response: Response): Promise<void> | undefined {
    return settledResponses.get(response);
}
