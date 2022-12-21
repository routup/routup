/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { HeaderName } from '../../constants';
import { Response } from '../../type';
import { setResponseContentTypeByFileName } from './utils';

export function setResponseHeaderAttachment(res: Response, filename?: string) {
    if (typeof filename === 'string') {
        setResponseContentTypeByFileName(res, filename);
    }

    res.setHeader(
        HeaderName.CONTENT_DISPOSITION,
        `attachment${filename ? `; filename="${filename}"` : ''}`,
    );
}
