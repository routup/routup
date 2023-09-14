import {
    cleanDoubleSlashes,
    hasTrailingSlash,
    withTrailingSlash,
    withoutLeadingSlash,
    withoutTrailingSlash,
} from '../../../src/utils';

describe('src/utils/url', () => {
    it('should determine trailing slash', () => {
        expect(hasTrailingSlash('/foo/?bar=baz', true)).toEqual(true);
        expect(hasTrailingSlash('/foo?bar=baz', true)).toEqual(false);
    });

    it('should remove trailing slash', () => {
        expect(withoutTrailingSlash('/foo/?bar=baz', true)).toEqual('/foo?bar=baz');
        expect(withoutTrailingSlash('/foo?bar=baz', true)).toEqual('/foo?bar=baz');
    });

    it('should append trailing slash', () => {
        expect(withTrailingSlash('/foo')).toEqual('/foo/');
        expect(withTrailingSlash('/foo?bar=baz', true)).toEqual('/foo/?bar=baz');
        expect(withTrailingSlash('/foo/?bar=baz', true)).toEqual('/foo/?bar=baz');
    });

    it('should clean double slashes', () => {
        expect(cleanDoubleSlashes('/foo//bar')).toEqual('/foo/bar');
    });

    it('should remove leading slash', () => {
        expect(withoutLeadingSlash('/foo?bar=baz')).toEqual('foo?bar=baz');
    });
});
