/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { URL, pathToFileURL } from 'node:url';

export function isFileURL(input: string) : boolean {
    let url: URL;

    try {
        url = new URL(input);
    } catch (e) {
        url = pathToFileURL(input);
    }

    return url.protocol === 'file:';
}
