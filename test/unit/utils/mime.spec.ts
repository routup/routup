import { getCharsetForMimeType } from '../../../src';

describe('src/utils/mime', () => {
    it('should get charset for content type', () => {
        let charset = getCharsetForMimeType('image/png');
        expect(charset).toBeUndefined();

        charset = getCharsetForMimeType('application/json');
        expect(charset).toEqual('utf-8');
    });
});
