/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ServerResponse } from 'http';
import { HeaderName } from '../../constants';

const BodySymbol = Symbol.for('ResBody');

export function useResponseBody(res: ServerResponse) : Buffer | undefined {
    if (BodySymbol in res) {
        return (res as any)[BodySymbol];
    }

    return undefined;
}

export function setResponseBody(res: ServerResponse, body: Buffer) {
    (res as any)[BodySymbol] = body;
}

/* istanbul ignore next */
export function useResponseBodyFormatted(res: ServerResponse) : unknown {
    const body = useResponseBody(res);
    if (typeof body === 'undefined') {
        return undefined;
    }

    let contentType = res.getHeader(HeaderName.CONTENT_TYPE);
    if (!contentType) {
        return contentType;
    }

    if (Array.isArray(contentType)) {
        contentType = contentType.shift();
    } else {
        contentType = `${contentType}`.split('; ').shift();
    }

    switch (contentType) {
        case 'application/json':
            return JSON.parse(body.toString('utf-8'));
        case 'text/html':
            return body.toString('utf-8');
    }

    return body;
}
