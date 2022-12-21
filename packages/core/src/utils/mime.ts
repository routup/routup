/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import mime from 'mime';

export function getMimeType(type: string) : string | undefined {
    if (type.indexOf('/') !== -1) {
        return type;
    }

    return mime.getType(type) || undefined;
}

export function getCharsetForMimeType(type: string) : string | undefined {
    if ((/^text\/|^application\/(javascript|json)/).test(type)) {
        return 'utf-8';
    }

    return undefined;
}
