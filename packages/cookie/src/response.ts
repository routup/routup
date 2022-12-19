/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { HeaderName, Response, appendResponseHeader } from '@routup/core';
import { serialize } from 'cookie';
import { SerializeOptions } from './type';

export function setResponseCookie(res: Response, name: string, value: string, options?: SerializeOptions) {
    appendResponseHeader(res, HeaderName.SET_COOKIE, serialize(name, value, {
        path: '/',
        ...(options || {}),
    }));
}

/* istanbul ignore next */
export function unsetResponseCookie(res: Response, name: string, options?: SerializeOptions) {
    setResponseCookie(res, name, '', {
        ...(options || {}),
        maxAge: 0,
    });
}
