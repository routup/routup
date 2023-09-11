import {
    HeaderName, Router, dispatchWebRequest, send,
} from '../../../src';

describe('bridge/web', () => {
    it('should dispatch request', async () => {
        const router = new Router();

        router.get('/foo', async (
            _req,
            res,
        ) => send(res, '/foo'));

        const response = await dispatchWebRequest(
            router,
            new Request(new URL('/foo', 'http://localhost/'), {
                method: 'GET',
                path: '/foo',
            }),
        );

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
});
