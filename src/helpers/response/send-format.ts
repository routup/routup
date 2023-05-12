/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Response } from '../../type';

export type ResponseFormat = {
    [key: string]: () => void,
    default: () => void
};

export function sendFormat(_res: Response, _format: ResponseFormat) {

}
