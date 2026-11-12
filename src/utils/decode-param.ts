/**
 * Decode a percent-encoded route param value. A malformed percent
 * sequence leaves the value raw instead of throwing; non-string
 * input (a param that did not participate in a match) passes through
 * unchanged.
 */
export function decodeParam(input: string): string;
export function decodeParam<T>(input: T): T | string;
export function decodeParam(input: unknown): unknown {
    if (typeof input !== 'string') {
        return input;
    }

    try {
        return decodeURIComponent(input);
    } catch {
        return input;
    }
}
