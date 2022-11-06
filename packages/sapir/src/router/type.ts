/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export type RouterOptions = {
    /**
     * Milliseconds (ms) until request should time out.
     *
     * @type number
     * @default 60_000
     */
    timeout?: number,

    /**
     * Mount path.
     *
     * @type string
     * @default '/'
     */
    mountPath?: string
};
