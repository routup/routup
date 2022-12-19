/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createReadStream } from 'fs';
import path from 'path';
import { HeaderName } from '../../constants';
import { Response } from '../../type';
import { setResponseHeaderAttachment } from './header-attachment';
import { sendStream } from './send-stream';

export function sendFile(res: Response, filePath: string, fn?: CallableFunction) {
    const dispositionHeader = res.getHeader(HeaderName.CONTENT_DISPOSITION);
    if (!dispositionHeader) {
        setResponseHeaderAttachment(res, path.basename(filePath));
    }

    const stream = createReadStream(filePath);

    sendStream(res, stream, fn);
}
