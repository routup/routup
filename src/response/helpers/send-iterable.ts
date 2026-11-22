import type { IAppEvent } from '../../event/index.ts';
import { createIterableResponse } from '../iterable.ts';

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
