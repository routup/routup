import { clearInterval } from 'node:timers';
import supertest from 'supertest';
import { HeaderName, createEventStream } from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/response/server-event', () => {
    let server : ReturnType<typeof supertest>;

    beforeAll(() => {
        server = supertest(createRequestListener(async (_req, res) => {
            const serverEvent = createEventStream(res);

            let i = 0;
            const interval = setInterval(() => {
                serverEvent.write({ data: 'hello world' });

                i++;
                if (i > 50) {
                    clearInterval(interval);
                    serverEvent.end();
                }
            });
        }));
    });

    it('streams events', async () => {
        let messageCount = 0;

        server
            .get('/')
            .expect(200)
            .expect(HeaderName.CONTENT_TYPE, 'text/event-stream')
            .buffer()
            .parse((res, callback) => {
                res.on('data', (chunk: Buffer) => {
                    messageCount++;
                    const message = chunk.toString();
                    expect(message).toEqual('data: hello world\n\n');
                });

                res.on('end', () => {
                    callback(null, '');
                });
            })
            .then()
            .catch();

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 100);
        });

        expect(messageCount).toBeGreaterThan(0);
    });
});
