/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Options as EtagBaseOptions } from 'etag';

export type EtagOptions = EtagBaseOptions & {
    /**
     * Threshold of bytes from which an etag is generated.
     *
     * default: undefined
     */
    threshold?: number
};
export type EtagFn = (body: any, encoding?: BufferEncoding, size?: number) => string | undefined;

export type EtagInput = boolean | EtagOptions | EtagFn;
