/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { HeaderName } from '../../constants';
import type { Request } from '../../type';

export function isRequestCacheable(req: Request, modifiedTime: string | Date) : boolean {
    const modifiedSince = req.headers[HeaderName.IF_MODIFIED_SINCE];
    if (!modifiedSince) {
        return false;
    }

    modifiedTime = typeof modifiedTime === 'string' ?
        new Date(modifiedTime) :
        modifiedTime;

    return new Date(modifiedSince) >= modifiedTime;
}
