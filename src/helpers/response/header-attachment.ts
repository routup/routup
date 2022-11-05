/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ServerResponse } from 'http';
import path from 'path';
import { RPCHeader } from '../../constants';
import { getMimeType } from '../../utils';

export function setResponseHeaderAttachment(res: ServerResponse, filename?: string) {
    if (typeof filename === 'string') {
        const ext = path.extname(filename);
        if (ext) {
            const type = getMimeType(ext.substring(1));
            if (type) {
                res.setHeader(RPCHeader.CONTENT_TYPE, type);
            }
        }
    }

    res.setHeader(
        RPCHeader.CONTENT_DISPOSITION,
        `attachment${filename ? `; filename="${filename}"` : ''}`,
    );
}
