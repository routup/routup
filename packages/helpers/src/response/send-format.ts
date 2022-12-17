/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { ServerResponse } from 'http';

export type ResponseFormat = {
    [key: string]: () => void,
    default: () => void
};

export function sendFormat(res: ServerResponse, format: ResponseFormat) {

}
