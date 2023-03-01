/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import path from 'node:path';
import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import { getCharsetForMimeType, getMimeType } from '../../utils';

export function setResponseContentTypeByFileName(res: Response, fileName: string) {
    const ext = path.extname(fileName);
    if (ext) {
        let type = getMimeType(ext.substring(1));
        if (type) {
            const charset = getCharsetForMimeType(type);
            if (charset) {
                type += `; charset=${charset}`;
            }
            res.setHeader(HeaderName.CONTENT_TYPE, type);
        }
    }
}

export function onResponseFinished(
    res: Response,
    cb: (err?: Error) => void,
) {
    let called : boolean;

    const callCallback = (err?: Error) => {
        if (called) return;

        called = true;

        cb(err);
    };

    res.on('finish', async () => {
        callCallback();
    });

    res.on('close', async () => {
        callCallback();
    });

    res.on('error', async (err) => {
        callCallback(err);
    });
}
