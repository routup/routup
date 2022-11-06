/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';
import { HeaderName } from '../../constants';
import { getMimeType } from '../../utils';
import { getRequestHeader } from './header';

export function matchRequestContentType(req: IncomingMessage, contentType: string) : boolean {
    const header = getRequestHeader(req, HeaderName.CONTENT_TYPE);
    if (!header) {
        return true;
    }

    /* istanbul ignore next */
    if (Array.isArray(header)) {
        if (header.length === 0) {
            return true;
        }

        return header[0] === getMimeType(contentType);
    }

    return header.split('; ').shift() === getMimeType(contentType);
}
