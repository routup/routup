import {
    HeaderName, Router, dispatchRawRequest, send,
} from '../../../src';

describe('bridge/raw', () => {
    it('should dispatch request', async () => {
        const router = new Router();

        router.get('/foo', async (
            _req,
            res,
        ) => send(res, '/foo'));

        const response = await dispatchRawRequest(router, {
            method: 'GET',
            path: '/foo',
        });

        expect(response.headers).toBeDefined();
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_ENCODING]).toEqual('utf-8');
        expect(response.status).toEqual(200);
        expect(Buffer.from(response.body as ArrayBuffer).toString('utf-8')).toEqual('/foo');
    });
});
