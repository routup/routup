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
    validateName(name);

    const { dur, desc } = options;

    if (dur !== undefined && (!Number.isFinite(dur) || dur < 0)) {
        throw new TypeError('The Server-Timing duration must be a finite number >= 0.');
    }

    let value = name;

    if (desc) {
        value += `;desc="${desc.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

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
    validateName(name);

    const start = performance.now();

    try {
        return await fn();
    } finally {
        setResponseServerTiming(event, name, {
            desc: options.desc,
            dur: performance.now() - start,
        });
    }
}
