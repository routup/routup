import {
    HeaderName, Router, appendResponseHeader, createWebDispatcher, send,
} from '../../../src';

describe('bridge/web', () => {
    it('should dispatch request', async () => {
        const router = new Router();

        router.get('/foo', async (
            _req,
            res,
        ) => send(res, '/foo'));

        const dispatch = createWebDispatcher(router);
        const request = new Request(new URL('/foo', 'http://localhost/'), {
            method: 'GET',
            path: '/foo',
        });
        const response = await dispatch(request);

        expect(response.headers).toBeDefined();
        expect(response.status).toEqual(200);

        expect([...response.headers.entries()]).toMatchObject([
            [HeaderName.CONTENT_ENCODING, 'utf-8'],
            [HeaderName.CONTENT_LENGTH, '4'],
            [HeaderName.CONTENT_TYPE, 'text/html; charset=utf-8'],
            [HeaderName.ETag, 'W/"4-bb1UjMA+RLi0S25o5WJVzkJzrkk"'],
        ]);

        const data = await response.text();
        expect(data).toEqual('/foo');
    });

    it('should split cookie string', async () => {
        const router = new Router();

        router.get('/', async (
            _req,
            res,
        ) => {
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'foo=bar, bar=baz');
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'buz=boz');
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'bir=baz');

            return send(res);
        });

        const dispatch = createWebDispatcher(router);
        const request = new Request(new URL('/', 'http://localhost/'), {
            method: 'GET',
        });
        const response = await dispatch(request);

        expect([...response.headers.entries()]).toEqual([
            [HeaderName.SET_COOKIE, 'foo=bar'],
            [HeaderName.SET_COOKIE, 'bar=baz'],
            [HeaderName.SET_COOKIE, 'buz=boz'],
            [HeaderName.SET_COOKIE, 'bir=baz'],
        ]);
    });
});
