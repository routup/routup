/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import path from 'path';
import { HeaderName } from '../../constants';
import { Response } from '../../type';
import { getMimeType } from '../../utils';

export function setResponseHeaderAttachment(res: Response, filename?: string) {
    if (typeof filename === 'string') {
        const ext = path.extname(filename);
        if (ext) {
            const type = getMimeType(ext.substring(1));
            if (type) {
                res.setHeader(HeaderName.CONTENT_TYPE, type);
            }
        }
    }

    res.setHeader(
        HeaderName.CONTENT_DISPOSITION,
        `attachment${filename ? `; filename="${filename}"` : ''}`,
    );
}
