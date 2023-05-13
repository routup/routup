/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { getCharsetForMimeType } from '../../../src';

describe('src/utils/mime', () => {
    it('should get charset for content type', () => {
        let charset = getCharsetForMimeType('image/png');
        expect(charset).toBeUndefined();

        charset = getCharsetForMimeType('application/json');
        expect(charset).toEqual('utf-8');
    });
});
