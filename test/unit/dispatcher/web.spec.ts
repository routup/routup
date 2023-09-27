import { BadRequestError } from '@ebec/http';
import {
    HeaderName,
    Router,
    appendResponseHeader,
    coreHandler,
    createWebDispatcher,
} from '../../../src';

describe('bridge/web', () => {
    it('should dispatch request', async () => {
        const router = new Router();

        router.get('/foo', coreHandler(() => '/foo'));

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

    it('should dispatch request with error', async () => {
        const router = new Router();

        router.get('/foo', coreHandler(() => {
            throw new BadRequestError();
        }));

        const dispatch = createWebDispatcher(router);
        const request = new Request(new URL('/foo', 'http://localhost/'), {
            method: 'GET',
            path: '/foo',
        });
        const response = await dispatch(request);

        expect(response.status).toEqual(400);
        expect(response.statusText).toEqual('Bad Request');
    });

    it('should split cookie string', async () => {
        const router = new Router();

        router.get(coreHandler((_req, res) => {
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'foo=bar, bar=baz');
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'buz=boz');
            appendResponseHeader(res, HeaderName.SET_COOKIE, 'bir=baz');

            return null;
        }));

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
