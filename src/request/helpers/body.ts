import type { IRoutupEvent } from '../../event/index.ts';

const BODY_KEY = /* @__PURE__ */ Symbol.for('routup:body');

/**
 * Read and parse the request body.
 *
 * - `application/x-www-form-urlencoded` → plain object (duplicate keys become arrays)
 * - `application/json` or other → attempts JSON parse, returns undefined on failure
 *
 * The result is cached on the event store — calling `readBody()` multiple
 * times returns the same parsed result.
 *
 * For binary or streaming access, use `event.request.arrayBuffer()`,
 * `event.request.blob()`, or `event.request.body` directly.
 *
 * @experimental
 */
export async function readBody<T = unknown>(event: IRoutupEvent): Promise<T | undefined> {
    const cached = event.store[BODY_KEY];
    if (cached !== undefined) {
        return cached as T;
    }

    const text = await event.request.text();

    let result: unknown | undefined;

    const contentType = event.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
        result = parseURLEncodedBody(text);
    } else {
        try {
            result = JSON.parse(text);
        } catch {
            result = undefined;
        }
    }

    event.store[BODY_KEY] = result;
    return result as T;
}

function parseURLEncodedBody(body: string): Record<string, unknown> {
    const form = new URLSearchParams(body);
    const parsed: Record<string, unknown> = Object.create(null);

    for (const [key, value] of form.entries()) {
        const existing = parsed[key];
        if (existing !== undefined) {
            if (Array.isArray(existing)) {
                existing.push(value);
            } else {
                parsed[key] = [existing, value];
            }
        } else {
            parsed[key] = value;
        }
    }

    return parsed;
}
