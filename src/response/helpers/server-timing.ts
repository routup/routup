import { HeaderName } from '../../constants.ts';
import type { IAppEvent } from '../../event/index.ts';

export type ResponseServerTimingOptions = {
    /**
     * Duration in milliseconds. Must be finite and >= 0.
     */
    dur?: number,
    /**
     * Human-readable description.
     */
    desc?: string,
};

const TOKEN = /^[\w!#$%&'*+.^`|~-]+$/;

function validateName(name: string) : void {
    if (!TOKEN.test(name)) {
        throw new TypeError(`The Server-Timing metric name ${JSON.stringify(name)} is not a valid token.`);
    }
}

// HTAB, SP-~ and obs-text: the characters a header field value may hold
const FIELD_VALUE = /^[\t\x20-\x7E\x80-\xFF]*$/;

/**
 * Build `name;desc="..."`, rejecting a description no header value can hold.
 */
function formatMetric(name: string, desc?: string) : string {
    validateName(name);

    if (!desc) {
        return name;
    }

    if (!FIELD_VALUE.test(desc)) {
        throw new TypeError(`The Server-Timing description ${JSON.stringify(desc)} contains characters not allowed in a header value.`);
    }

    return `${name};desc="${desc.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function validateDuration(dur?: number) : void {
    if (dur !== undefined && (!Number.isFinite(dur) || dur < 0)) {
        throw new TypeError('The Server-Timing duration must be a finite number >= 0.');
    }
}

/**
 * Append a metric to the Server-Timing response header.
 *
 * Only a response built from `event.response` carries it.
 */
export function setResponseServerTiming(
    event: IAppEvent,
    name: string,
    options: ResponseServerTimingOptions = {},
) : void {
    const { dur, desc } = options;

    let value = formatMetric(name, desc);

    validateDuration(dur);

    if (dur !== undefined) {
        value += `;dur=${dur}`;
    }

    event.response.headers.append(HeaderName.SERVER_TIMING, value);
}

/**
 * Run a callback and record its duration as a Server-Timing metric,
 * also when it throws (the error is re-thrown).
 */
export async function withResponseServerTiming<T>(
    event: IAppEvent,
    name: string,
    fn: () => T | Promise<T>,
    options: Pick<ResponseServerTimingOptions, 'desc'> = {},
) : Promise<T> {
    // built before `fn` runs, so a bad name or description never replaces its result
    const metric = formatMetric(name, options.desc);
    const start = performance.now();

    try {
        return await fn();
    } finally {
        event.response.headers.append(
            HeaderName.SERVER_TIMING,
            `${metric};dur=${performance.now() - start}`,
        );
    }
}
