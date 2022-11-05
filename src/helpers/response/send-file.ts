/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { createReadStream } from 'fs';
import { ServerResponse } from 'http';
import path from 'path';
import { RPCHeader } from '../../constants';
import { Next } from '../../type';
import { setResponseHeaderAttachment } from './header-attachment';
import { sendStream } from './send-stream';

export function sendFile(res: ServerResponse, filePath: string, fn?: Next) {
    const dispositionHeader = res.getHeader(RPCHeader.CONTENT_DISPOSITION);
    if (!dispositionHeader) {
        setResponseHeaderAttachment(res, path.basename(filePath));
    }

    const stream = createReadStream(filePath);

    sendStream(res, stream, fn);
}
