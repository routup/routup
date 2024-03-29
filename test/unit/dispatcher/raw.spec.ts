import { TooManyRequestsError } from '@ebec/http';
import fs from 'node:fs';
import {
    HeaderName, Router, coreHandler, createRawDispatcher, send, setResponseHeaderContentType,
} from '../../../src';

function transformArrayBufferToString(input?: ArrayBuffer) {
    if (!input) {
        return '';
    }

    return Buffer.from(input).toString('utf-8');
}

describe('bridge/raw', () => {
    it('should dispatch request', async () => {
        const router = new Router();

        router.get('/foo', coreHandler(() => '/foo'));

        const dispatch = createRawDispatcher(router);

        const response = await dispatch({
            method: 'GET',
            path: '/foo',
        });

        expect(response.headers).toBeDefined();
        expect(response.headers[HeaderName.CONTENT_TYPE]).toEqual('text/html; charset=utf-8');
        expect(response.headers[HeaderName.CONTENT_ENCODING]).toEqual('utf-8');
        expect(response.status).toEqual(200);
        expect(transformArrayBufferToString(response.body)).toEqual('/foo');
    });

    it('should not dispatch request', async () => {
        const router = new Router();

        router.get('/', coreHandler(() => null));

        const dispatch = createRawDispatcher(router);

        const response = await dispatch({
            method: 'GET',
            path: '/foo',
        });

        expect(response.headers).toBeDefined();
        expect(response.status).toEqual(404);
    });

    it('should dispatch request with error', async () => {
        const router = new Router();

        router.get('/', coreHandler(async () => {
            throw new TooManyRequestsError();
        }));

        const dispatch = createRawDispatcher(router);

        const response = await dispatch({
            method: 'GET',
            path: '/',
        });

        expect(response.status).toEqual(429);
        expect(response.statusMessage).toEqual('Too Many Requests');
    });

    it('should dispatch request with body', async () => {
        const router = new Router();

        router.post('/foo', coreHandler(async (
            req,
            res,
        ) => {
            const chunks: Buffer[] = [];

            req.on('data', (chunk) => {
                chunks.push(chunk);
            });

            req.on('end', () => {
                const output = Buffer.concat(chunks);
                setResponseHeaderContentType(res, 'application/json');
                send(res, output.toString('utf-8'));
            });

            req.read();
        }));

        const stream = fs.createReadStream('test/data/dummy.json');
        const dispatch = createRawDispatcher(router);
        const response = await dispatch({
            method: 'POST',
            path: '/foo',
            headers: {
                [HeaderName.CONTENT_TYPE]: 'application/json; charset=utf-8',
            },
            body: stream,
        });

        expect(response.status).toEqual(200);
        const content = JSON.parse(transformArrayBufferToString(response.body));
        expect(content).toEqual({
            id: 1,
            name: 'tada5hi',
        });
    });
});
