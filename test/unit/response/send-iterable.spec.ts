import { 
    describe, 
    expect, 
    it, 
    vi, 
} from 'vitest';
import { App, defineCoreHandler, defineErrorHandler } from '../../../src';
import { isStreamableIterable, sendIterable } from '../../../src/response/helpers/send-iterable';
import { createTestEvent, createTestRequest } from '../../helpers';

describe('src/response/helpers/send-iterable', () => {
    it('should stream an async generator returned by a handler', async () => {
        const app = new App();

        app.get('/', defineCoreHandler(async function* handler() {
            yield 'a';
            yield 'b';
            yield 'c';
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('abc');
    });

    it('should stream a sync generator', async () => {
        const app = new App();

        app.get('/', defineCoreHandler(() => (function* gen() {
            yield 'x';
            yield 'y';
        }())));

        const response = await app.fetch(createTestRequest('/'));

        expect(await response.text()).toBe('xy');
    });

    it('should keep arrays, sets and plain objects as JSON', async () => {
        const app = new App();

        app.get('/array', defineCoreHandler(() => ['a', 'b']));
        app.get('/set', defineCoreHandler(() => new Set(['a'])));
        app.get('/obj', defineCoreHandler(() => ({ a: 1 })));

        const array = await app.fetch(createTestRequest('/array'));

        expect(array.headers.get('content-type')).toContain('application/json');
        expect(await array.text()).toBe('["a","b"]');

        const set = await app.fetch(createTestRequest('/set'));

        expect(await set.text()).toBe('{}');

        const obj = await app.fetch(createTestRequest('/obj'));

        expect(await obj.text()).toBe('{"a":1}');
    });

    it('should turn a throw before the first yield into a normal error', async () => {
        const app = new App();

        // eslint-disable-next-line require-yield
        app.get('/', defineCoreHandler(async function* handler() {
            throw new Error('boom');
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(response.status).toBe(500);
    });

    it('should route a throw before the first yield to error handlers', async () => {
        const app = new App();

        // eslint-disable-next-line require-yield
        app.get('/', defineCoreHandler(async function* handler() {
            throw new Error('boom');
        }));
        app.use(defineErrorHandler((error) => `handled ${error.message}`));

        const response = await app.fetch(createTestRequest('/'));

        expect(await response.text()).toContain('handled');
    });

    it('should serialize values by default', async () => {
        const app = new App();
        const bytes = new TextEncoder().encode('B');

        app.get('/', defineCoreHandler(async function* handler() {
            yield 'a';
            yield bytes;
            yield new Uint16Array([0x4343]);
            yield 1;
            yield true;
            yield 10n;
            yield { k: 'v' };
            yield undefined;
            yield () => 1;
            yield Symbol('s');
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(await response.text()).toBe('aBCC1true10{"k":"v"}');
    });

    it('should use a custom serializer', async () => {
        const app = new App();

        app.get('/', defineCoreHandler((event) => sendIterable(
            event,
            (function* gen() {
                yield 1;
                yield 2;
            }()),
            { serializer: (v) => `[${v}]` },
        )));

        const response = await app.fetch(createTestRequest('/'));

        expect(await response.text()).toBe('[1][2]');
    });

    it('should run the generator finally block on cancel', async () => {
        const cleanup = vi.fn();
        const app = new App();

        app.get('/', defineCoreHandler(async function* handler() {
            try {
                yield 'a';
                yield 'b';
                yield 'c';
            } finally {
                cleanup();
            }
        }));

        const response = await app.fetch(createTestRequest('/'));
        const reader = response.body!.getReader();

        await reader.read();
        await reader.cancel();

        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should set no content-type by default and keep a given one', async () => {
        const app = new App();

        app.get('/plain', defineCoreHandler(async function* handler() {
            yield 'a';
        }));
        app.get('/typed', defineCoreHandler(async function* handler(event) {
            event.response.headers.set('content-type', 'text/csv');
            yield 'a';
        }));

        const plain = await app.fetch(createTestRequest('/plain'));

        expect(plain.headers.has('content-type')).toBe(false);

        const typed = await app.fetch(createTestRequest('/typed'));

        expect(typed.headers.get('content-type')).toBe('text/csv');
    });

    it('should accept an iterable and a source function through sendIterable', async () => {
        const app = new App();

        app.get('/iterable', defineCoreHandler((event) => sendIterable(event, ['a', 'b'])));
        app.get('/fn', defineCoreHandler((event) => sendIterable(event, async function* gen() {
            yield 'z';
        })));

        expect(await (await app.fetch(createTestRequest('/iterable'))).text()).toBe('ab');
        expect(await (await app.fetch(createTestRequest('/fn'))).text()).toBe('z');
    });

    it('should apply the handler timeout to a generator before its first yield', async () => {
        const cleanup = vi.fn();
        const app = new App({ options: { handlerTimeout: 50 } });

        app.get('/', defineCoreHandler(async function* handler() {
            try {
                await new Promise((resolve) => {
                    setTimeout(resolve, 300); 
                });
                yield 'late';
            } finally {
                cleanup();
            }
        }));

        const start = Date.now();
        const response = await app.fetch(createTestRequest('/'));

        expect(response.status).toBe(408);
        expect(Date.now() - start).toBeLessThan(250);

        await new Promise((resolve) => {
            setTimeout(resolve, 400); 
        });

        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should not leak an uncaught error when return() throws on timeout', async () => {
        const app = new App({ options: { handlerTimeout: 50 } });
        const uncaught = vi.fn();

        process.on('uncaughtException', uncaught);

        try {
            app.get('/', defineCoreHandler(() => ({
                [Symbol.asyncIterator]() {
                    return {
                        next: () => new Promise<IteratorResult<unknown>>(() => {}),
                        return() {
                            throw new Error('return failed');
                        },
                    };
                },
            })));

            const response = await app.fetch(createTestRequest('/'));

            expect(response.status).toBe(408);

            await new Promise((resolve) => {
                setTimeout(resolve, 50); 
            });

            expect(uncaught).not.toHaveBeenCalled();
        } finally {
            process.off('uncaughtException', uncaught);
        }
    });

    it('should close the iterator when the signal is already aborted', async () => {
        const returned = vi.fn();
        const event = createTestEvent('/', { signal: AbortSignal.abort() });

        const response = await sendIterable(event, {
            [Symbol.iterator]() {
                return {
                    next: () => ({ done: false, value: 'a' }),
                    return: () => {
                        returned();

                        throw new Error('return failed');
                    },
                };
            },
        });

        expect(returned).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
    });

    it('should stream a string passed to sendIterable', async () => {
        const app = new App();

        app.get('/', defineCoreHandler((event) => sendIterable(event, 'abc')));

        const response = await app.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        expect(await response.text()).toBe('abc');
    });

    it('should reject the body read on a mid-stream throw', async () => {
        const app = new App();

        app.get('/', defineCoreHandler(async function* handler() {
            yield 'a';

            throw new Error('boom');
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(response.status).toBe(200);
        await expect(response.text()).rejects.toThrow();
    });

    it('should keep a Map as JSON', async () => {
        const app = new App();

        app.get('/', defineCoreHandler(() => new Map([['a', 1]])));

        const response = await app.fetch(createTestRequest('/'));

        expect(response.headers.get('content-type')).toContain('application/json');
        expect(await response.text()).toBe('{}');
    });

    it('should close the iterator and report an error when the serializer throws on the first chunk', async () => {
        const finalized = vi.fn();

        const original = new Error('serializer boom');
        const event = createTestEvent('/');
        const iterator = (async function* gen() {
            try {
                yield 'a';
            } finally {
                finalized();
            }
        }());

        await expect(sendIterable(event, iterator, {
            serializer: () => {
                throw original;
            },
        })).rejects.toBe(original);
        expect(finalized).toHaveBeenCalledTimes(1);

        const circular: Record<string, unknown> = {};

        circular.self = circular;

        const app2 = new App();

        app2.get('/', defineCoreHandler(async function* handler() {
            try {
                yield circular;
            } finally {
                finalized();
            }
        }));
        app2.use(defineErrorHandler(() => new Response('handled', { status: 500 })));

        const res2 = await app2.fetch(createTestRequest('/'));

        expect(res2.status).toBe(500);
        expect(finalized).toHaveBeenCalledTimes(2);
    });

    it('should close the iterator and reject the body read when the serializer throws on a later chunk', async () => {
        const finalized = vi.fn();
        const app = new App();

        app.get('/', defineCoreHandler(async function* handler() {
            try {
                yield 'a';
                yield 'b';
                yield 'c';
            } finally {
                finalized();
            }
        }));

        const event = createTestEvent('/');
        const res = await sendIterable(event, (async function* gen() {
            try {
                yield 'a';
                yield 'b';
            } finally {
                finalized();
            }
        }()), {
            serializer: (value) => {
                if (value === 'b') {
                    throw new Error('late boom');
                }

                return value as string;
            },
        });

        await expect(res.text()).rejects.toThrow('late boom');
        expect(finalized).toHaveBeenCalledTimes(1);
    });

    describe('signal after the first chunk under a handler timeout', () => {
        const waitForAbort = (signal: AbortSignal) => new Promise<never>((_, reject) => {
            if (signal.aborted) {
                reject(signal.reason);

                return;
            }

            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });

        it('should abort the generator signal when the request aborts after the first chunk', async () => {
            const controller = new AbortController();
            const aborted = vi.fn();
            const finalized = vi.fn();
            const app = new App({ options: { handlerTimeout: 1000 } });

            app.get('/', defineCoreHandler(async function* handler(event) {
                try {
                    yield 'a';

                    try {
                        await waitForAbort(event.signal);
                    } catch {
                        aborted();
                    }
                } finally {
                    finalized();
                }
            }));

            const response = await app.fetch(createTestRequest('/', { signal: controller.signal }));
            const reader = response.body!.getReader();

            expect(new TextDecoder().decode((await reader.read()).value)).toBe('a');

            const done = reader.read();

            controller.abort();

            expect((await done).done).toBe(true);
            expect(aborted).toHaveBeenCalledTimes(1);
            expect(finalized).toHaveBeenCalledTimes(1);
        });

        it('should abort the signal of a sendIterable source when the request aborts after the first chunk', async () => {
            const controller = new AbortController();
            const aborted = vi.fn();
            const app = new App({ options: { handlerTimeout: 1000 } });

            app.get('/', defineCoreHandler((event) => sendIterable(event, (async function* gen() {
                yield 'a';

                try {
                    await waitForAbort(event.signal);
                } catch {
                    aborted();
                }
            }()))));

            const response = await app.fetch(createTestRequest('/', { signal: controller.signal }));
            const reader = response.body!.getReader();

            await reader.read();

            const done = reader.read();

            controller.abort();

            expect((await done).done).toBe(true);
            expect(aborted).toHaveBeenCalledTimes(1);
        });

        it('should unlink the signal from the request once the stream completes', async () => {
            const controller = new AbortController();
            let signal: AbortSignal | undefined;
            const app = new App({ options: { handlerTimeout: 1000 } });

            app.get('/', defineCoreHandler(async function* handler(event) {
                signal = event.signal;
                yield 'a';
                yield 'b';
            }));

            const response = await app.fetch(createTestRequest('/', { signal: controller.signal }));

            expect(await response.text()).toBe('ab');

            expect(() => controller.abort()).not.toThrow();
            expect(signal!.aborted).toBe(false);
        });

        it('should unlink the signal from the request once the stream is cancelled', async () => {
            const controller = new AbortController();
            let signal: AbortSignal | undefined;
            const app = new App({ options: { handlerTimeout: 1000 } });

            app.get('/', defineCoreHandler(async function* handler(event) {
                signal = event.signal;

                for (;;) {
                    yield 'a';
                }
            }));

            const response = await app.fetch(createTestRequest('/', { signal: controller.signal }));
            const reader = response.body!.getReader();

            await reader.read();
            await reader.cancel();

            controller.abort();

            expect(signal!.aborted).toBe(false);
        });

        it('should unlink the signal from the request once the stream errors', async () => {
            const controller = new AbortController();
            let signal: AbortSignal | undefined;
            const app = new App({ options: { handlerTimeout: 1000 } });

            app.get('/', defineCoreHandler(async function* handler(event) {
                signal = event.signal;
                yield 'a';

                throw new Error('boom');
            }));

            const response = await app.fetch(createTestRequest('/', { signal: controller.signal }));

            await expect(response.text()).rejects.toThrow('boom');

            controller.abort();

            expect(signal!.aborted).toBe(false);
        });

        it('should unlink the signal from the request when onAfter throws', async () => {
            const controller = new AbortController();
            let signal: AbortSignal | undefined;
            const app = new App({ options: { handlerTimeout: 1000 } });

            app.get('/', defineCoreHandler({
                onAfter: () => {
                    throw new Error('after');
                },
                fn: async function* handler(event) {
                    signal = event.signal;
                    yield 'a';
                },
            }));

            const response = await app.fetch(createTestRequest('/', { signal: controller.signal }));

            expect(response.status).toBe(500);

            controller.abort();

            expect(signal!.aborted).toBe(false);
        });
    });

    describe('iterator protocols', () => {
        it('should stream a sync generator whose Symbol.asyncIterator is undefined', async () => {
            const app = new App();

            app.get('/', defineCoreHandler(() => {
                const gen = (function* gen() {
                    yield 'x';
                    yield 'y';
                }());

                Object.defineProperty(gen, Symbol.asyncIterator, { value: undefined });

                return gen;
            }));

            const response = await app.fetch(createTestRequest('/'));

            expect(await response.text()).toBe('xy');
        });

        it('should fall back to Symbol.iterator in sendIterable when Symbol.asyncIterator is null', async () => {
            const event = createTestEvent('/');

            const response = await sendIterable(event, {
                [Symbol.asyncIterator]: null,
                * [Symbol.iterator]() {
                    yield 'a';
                },
            } as unknown as Iterable<unknown>);

            expect(await response.text()).toBe('a');
        });

        it('should report the protocols through isStreamableIterable', () => {
            const fnAsync = Object.assign(() => 'factory', {
                async* [Symbol.asyncIterator]() {
                    yield 'a';
                },
            });

            expect(isStreamableIterable(fnAsync)).toBe(true);
            expect(isStreamableIterable({ [Symbol.asyncIterator]: undefined })).toBe(false);
            expect(isStreamableIterable(() => 'plain')).toBe(false);
        });

        it('should stream a function implementing Symbol.asyncIterator', async () => {
            const factory = vi.fn();
            const source = Object.assign(factory, {
                async* [Symbol.asyncIterator]() {
                    yield 'a';
                    yield 'b';
                },
            });
            const app = new App();

            app.get('/', defineCoreHandler(() => source));

            const response = await app.fetch(createTestRequest('/'));

            expect(await response.text()).toBe('ab');
            expect(factory).not.toHaveBeenCalled();
        });

        it('should stream a function implementing Symbol.iterator and next()', async () => {
            const values = ['a', 'b'];
            const source = Object.assign(() => 'factory', {
                next: () => (values.length > 0 ?
                    { done: false, value: values.shift() } :
                    { done: true, value: undefined }),
                [Symbol.iterator]() {
                    return this;
                },
            });
            const app = new App();

            app.get('/', defineCoreHandler(() => source));

            const response = await app.fetch(createTestRequest('/'));

            expect(await response.text()).toBe('ab');
        });

        it('should use the protocol of a function source in sendIterable instead of calling it', async () => {
            const factory = vi.fn();
            const source = Object.assign(factory, {
                * [Symbol.iterator]() {
                    yield 'a';
                },
            });

            const response = await sendIterable(createTestEvent('/'), source as unknown as Iterable<unknown>);

            expect(await response.text()).toBe('a');
            expect(factory).not.toHaveBeenCalled();
        });

        it('should still call a plain function source in sendIterable as a factory', async () => {
            const response = await sendIterable(createTestEvent('/'), () => (function* gen() {
                yield 'a';
            }()));

            expect(await response.text()).toBe('a');
        });

        it('should not stream a plain function returned by a handler', async () => {
            const fn = vi.fn();
            const app = new App();

            app.get('/', defineCoreHandler(() => fn));

            const response = await app.fetch(createTestRequest('/'));

            // not iterable: takes the JSON path, which cannot serialize a function
            expect(response.status).toBe(500);
            expect(fn).not.toHaveBeenCalled();
        });
    });
});
