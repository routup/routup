/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import { getMimeType } from '../../utils';

export function setResponseHeaderContentType(res: Response, input: string, ifNotExists?: boolean) {
    if (ifNotExists) {
        const header = res.getHeader(HeaderName.CONTENT_TYPE);
        if (header) {
            return;
        }
    }

    const contentType = getMimeType(input);
    if (contentType) {
        res.setHeader(HeaderName.CONTENT_TYPE, contentType);
    }
}
