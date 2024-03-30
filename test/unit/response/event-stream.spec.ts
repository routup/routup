import { clearInterval } from 'node:timers';
import supertest from 'supertest';
import { HeaderName, createEventStream } from '../../../src';
import { createRequestListener } from '../../handler';

describe('src/helpers/response/server-event', () => {
    let server : ReturnType<typeof supertest>;

    beforeAll(() => {
        server = supertest(createRequestListener(async (_req, res) => {
            const stream = createEventStream(res);

            let interval : ReturnType<typeof setInterval> | undefined;
            stream.on('close', () => {
                if (interval) {
                    clearInterval(interval);
                }
            });

            let i = 0;
            interval = setInterval(() => {
                stream.write({ data: 'hello world' });

                i++;
                if (i > 50) {
                    stream.end();
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
