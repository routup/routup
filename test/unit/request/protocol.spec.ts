import supertest from 'supertest';
import { HeaderName, getRequestProtocol, send } from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/request/hostname', () => {
    it('should determine protocol', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, getRequestProtocol(req, { default: 'http', trustProxy: true }));
        }));

        await server
            .get('/')
            .expect('http');
    });

    it('should determine protocol of non-trusted', async () => {
        const server = supertest(createRequestListener((req, res) => {
            send(res, getRequestProtocol(req));
        }));

        await server
            .get('/')
            .set(HeaderName.X_FORWARDED_PROTO, 'https')
            .expect('http');
    });
});
