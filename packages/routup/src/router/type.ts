/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Path } from '../type';

export type RouterOptions = {
    /**
     * Milliseconds (ms) until the request should be canceled.
     *
     * @type number
     * @default undefined
     */
    timeout?: number,

    /**
     * Mount path.
     *
     * @type string
     * @default '/'
     */
    mountPath?: Path
};
