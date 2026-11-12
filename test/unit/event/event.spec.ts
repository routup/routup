import { describe, expect, it } from 'vitest';
import {
    App,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { PipelineStep } from '../../../src/app/pipeline';
import { PipelineState } from '../../../src/app/pipeline-state';
import { AppEvent } from '../../../src/event/module';
import type { AppEventCreateContext } from '../../../src/event/module';
import { createTestRequest } from '../../helpers';

function buildEvent(state: PipelineState): AppEvent {
    return new PipelineStep(state, [], 0).createEvent();
}

function createContext(
    next: AppEventCreateContext['next'],
): AppEventCreateContext {
    const request = createTestRequest('/');

    return {
        request,
        params: {},
        path: '/',
        method: 'GET',
        mountPath: '/',
        headers: request.headers,
        response: { status: 200, headers: new Headers() },
        store: {},
        signal: request.signal,
        appOptions: {},
        next,
    };
}

describe('src/app/pipeline-state (PipelineState)', () => {
    it('should initialize with correct properties', () => {
        const state = new PipelineState(createTestRequest('http://localhost/foo?bar=baz'));

        expect(state.method).toBe('GET');
        expect(state.path).toBe('/foo');
        expect(state.mountPath).toBe('/');
        expect(state.params).toEqual({});
        expect(state.dispatched).toBe(false);
        expect(state.error).toBeUndefined();
    });

    it('should lazily initialize response accumulator', () => {
        const state = new PipelineState(createTestRequest('/'));

        const res = state.response;

        expect(res.status).toBe(200);
        expect(res.headers).toBeInstanceOf(Headers);

        // Same instance on second access
        expect(state.response).toBe(res);
    });

    it('should default the signal to the request signal', () => {
        const request = createTestRequest('/');
        const state = new PipelineState(request);

        expect(state.signal).toBe(request.signal);

        const controller = new AbortController();

        state.signal = controller.signal;

        expect(state.signal).toBe(controller.signal);
        expect(buildEvent(state).signal).toBe(controller.signal);
    });

    it('should collect allowed methods only for OPTIONS requests', () => {
        const get = new PipelineState(createTestRequest('/'));
        const options = new PipelineState(createTestRequest('/', { method: 'OPTIONS' }));

        expect(get.methodsAllowed).toBeUndefined();
        expect(options.methodsAllowed).toBeInstanceOf(Set);
    });

    describe('createEvent', () => {
        it('should create an AppEvent with shared references', () => {
            const state = new PipelineState(createTestRequest('http://localhost/test'));

            state.response.status = 201;

            const routup = buildEvent(state);

            expect(routup).toBeInstanceOf(AppEvent);
            expect(routup.request).toBe(state.request);
            expect(routup.params).toBe(state.params);
            expect(routup.path).toBe(state.path);
            expect(routup.method).toBe(state.method);
            expect(routup.mountPath).toBe(state.mountPath);
            expect(routup.response).toBe(state.response);
            expect(routup.response.status).toBe(201);
        });

        it('should hand the handler a signal override', () => {
            const state = new PipelineState(createTestRequest('/'));
            const controller = new AbortController();
            const routup = new PipelineStep(state, [], 0).createEvent(controller.signal);

            expect(routup.signal).toBe(controller.signal);
        });

        it('should record the built event on the step', () => {
            const step = new PipelineStep(new PipelineState(createTestRequest('/')), [], 0);

            expect(step.event).toBeUndefined();

            const routup = step.createEvent();

            expect(step.event).toBe(routup);
        });

        it('should provide headers from request', () => {
            const state = new PipelineState(createTestRequest('/', { headers: { 'x-custom': 'value' } }));
            const routup = buildEvent(state);

            expect(routup.headers.get('x-custom')).toBe('value');
        });

        it('should parse searchParams', () => {
            const state = new PipelineState(createTestRequest('http://localhost/foo?a=1&b=2'));
            const routup = buildEvent(state);

            expect(routup.searchParams.get('a')).toBe('1');
            expect(routup.searchParams.get('b')).toBe('2');
        });

        it('should return the same searchParams on every read of one event', () => {
            const state = new PipelineState(createTestRequest('http://localhost/foo?a=1'));
            const routup = buildEvent(state);

            expect(routup.searchParams).toBe(routup.searchParams);
        });

        it('should give every built event its own searchParams', () => {
            const state = new PipelineState(createTestRequest('http://localhost/foo?a=1'));
            const first = buildEvent(state);
            const second = buildEvent(state);

            first.searchParams.set('a', '2');
            first.searchParams.set('b', '3');

            expect(second.searchParams.get('a')).toBe('1');
            expect(second.searchParams.has('b')).toBe(false);
        });

        it('should expose empty searchParams without a query string', () => {
            const routup = buildEvent(new PipelineState(createTestRequest('http://localhost/foo')));

            expect([...routup.searchParams]).toEqual([]);
        });

        it('should take path and query from the URL the adapter already parsed', () => {
            const request = createTestRequest('http://localhost/ignored?z=0');

            request._url = new URL('http://localhost/from-adapter?a=1');

            const state = new PipelineState(request);

            expect(state.path).toBe('/from-adapter');
            expect(buildEvent(state).searchParams.get('a')).toBe('1');
        });

        it('should have an isolated store per request', () => {
            const routup1 = buildEvent(new PipelineState(createTestRequest('/')));
            const routup2 = buildEvent(new PipelineState(createTestRequest('/')));

            routup1.store.foo = 'bar';

            expect(routup1.store.foo).toBe('bar');
            expect(routup2.store.foo).toBeUndefined();
        });

        it('should have a prototype-free store', () => {
            const routup = buildEvent(new PipelineState(createTestRequest('/')));

            expect(routup.store.toString).toBeUndefined();
            expect(routup.store.hasOwnProperty).toBeUndefined();
        });

        it('should support symbol keys in store', () => {
            const routup = buildEvent(new PipelineState(createTestRequest('/')));
            const key = Symbol.for('test:key');

            routup.store[key] = 42;
            expect(routup.store[key]).toBe(42);
        });

        it('should share store between events of one request', () => {
            const state = new PipelineState(createTestRequest('/'));

            const routup1 = buildEvent(state);

            routup1.store.shared = 'yes';

            const routup2 = buildEvent(state);

            expect(routup2.store.shared).toBe('yes');
        });

        it('should expose the appOptions the state was created with', () => {
            const state = new PipelineState(createTestRequest('/'), { subdomainOffset: 5 });
            const routup = buildEvent(state);

            expect(routup.appOptions.subdomainOffset).toBe(5);
        });

        it('should return undefined from next() when no match is left', async () => {
            const routup = buildEvent(new PipelineState(createTestRequest('/')));

            const result = await routup.next();

            expect(result).toBeUndefined();
            expect(routup.nextCalled).toBe(true);
        });

        it('should record an error passed to next() on the state', async () => {
            const state = new PipelineState(createTestRequest('/'));
            const routup = buildEvent(state);

            await routup.next(new Error('test error'));

            expect(state.error).toBeDefined();
            expect(state.error!.message).toBe('test error');
        });

        it('should not expose internal properties', () => {
            const routup = buildEvent(new PipelineState(createTestRequest('/')));

            expect('dispatched' in routup).toBe(false);
            expect('error' in routup).toBe(false);
            expect('appPath' in routup).toBe(false);
            expect('methodsAllowed' in routup).toBe(false);
            expect('setNext' in routup).toBe(false);
        });
    });
});

describe('src/event/module (AppEvent)', () => {
    it('should use searchParams handed to the constructor', () => {
        const searchParams = new URLSearchParams('x=1');
        const routup = new AppEvent({
            ...createContext(async () => undefined),
            searchParams,
        });

        expect(routup.searchParams).toBe(searchParams);
    });

    it('should delegate next() to the continuation of its context', async () => {
        const routup = new AppEvent(createContext(async () => new Response('from-context')));

        const response = await routup.next();

        expect(response).toBeInstanceOf(Response);
        expect(await response!.text()).toBe('from-context');
    });

    it('should hand itself and the error to the continuation', async () => {
        let receivedEvent: unknown;
        let receivedError: Error | undefined;

        const routup = new AppEvent(createContext(async (event, error) => {
            receivedEvent = event;
            receivedError = error;

            return new Response('handled');
        }));

        await routup.next(new Error('test error'));

        expect(receivedEvent).toBe(routup);
        expect(receivedError).toBeInstanceOf(Error);
        expect(receivedError!.message).toBe('test error');
    });

    it('should start the continuation once and cache its result', async () => {
        let callCount = 0;

        const routup = new AppEvent(createContext(async () => {
            callCount++;

            return new Response('ok');
        }));

        expect(routup.nextCalled).toBe(false);
        expect(routup.nextResult).toBeUndefined();

        const first = await routup.next();
        const second = await routup.next(new Error('ignored'));

        expect(callCount).toBe(1);
        expect(first).toBe(second);
        expect(routup.nextCalled).toBe(true);
        expect(await routup.nextResult).toBe(first);
    });

    it('should resolve whenNextCalled() once next() is invoked', async () => {
        const routup = new AppEvent(createContext(async () => undefined));
        let resolved = false;

        const pending = routup.whenNextCalled().then(() => {
            resolved = true;
        });

        await Promise.resolve();
        expect(resolved).toBe(false);

        void routup.next();
        await pending;

        expect(resolved).toBe(true);

        // Already called: resolves right away.
        await routup.whenNextCalled();
    });

    it('should return a promise when the continuation returns a plain value', async () => {
        const response = new Response('plain');
        const next = (() => response) as unknown as AppEventCreateContext['next'];
        const routup = new AppEvent(createContext(next));

        const result = routup.next();

        expect(result).toBeInstanceOf(Promise);
        expect(routup.nextResult).toBe(result);
        expect(await result).toBe(response);
        expect(routup.next()).toBe(result);
    });

    it('should reject the next() promise when the continuation throws synchronously', async () => {
        const routup = new AppEvent(createContext(() => {
            throw new Error('sync failure');
        }));

        const result = routup.next();

        await expect(result).rejects.toThrow('sync failure');
        expect(routup.nextCalled).toBe(true);
    });
});

describe('event.next() through app.fetch()', () => {
    it('should resolve next() with the downstream return value converted to a Response', async () => {
        const app = new App();
        let downstream: Response | undefined;

        app.use(defineCoreHandler(async (event) => {
            downstream = await event.next();

            return downstream;
        }));

        app.get('/', defineCoreHandler(() => 'hello'));

        const response = await app.fetch(createTestRequest('/'));

        expect(downstream).toBeInstanceOf(Response);
        expect(response).toBe(downstream);
        expect(await response.text()).toBe('hello');
    });

    it('should give every handler its own continuation', async () => {
        const app = new App();
        const seen: string[] = [];

        app.use(defineCoreHandler(async (event) => {
            const response = await event.next();

            seen.push(`first:${response?.status}`);

            return response;
        }));

        app.use(defineCoreHandler(async (event) => {
            const response = await event.next();

            seen.push(`second:${response?.status}`);

            return response;
        }));

        app.get('/', defineCoreHandler((event) => {
            event.response.status = 201;

            return 'created';
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(seen).toEqual(['second:201', 'first:201']);
        expect(await response.text()).toBe('created');
    });

    it('should resolve next() with undefined when no handler is left', async () => {
        const app = new App();
        let downstream: Response | undefined | null = null;

        app.use(defineCoreHandler(async (event) => {
            downstream = await event.next();

            return 'fallback';
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(downstream).toBeUndefined();
        expect(await response.text()).toBe('fallback');
    });

    it('should return the same result when next() is called twice', async () => {
        const app = new App();
        let downstreamCalls = 0;
        let first: Response | undefined;
        let second: Response | undefined;

        app.use(defineCoreHandler(async (event) => {
            first = await event.next();
            second = await event.next();

            return first;
        }));

        app.get('/', defineCoreHandler(() => {
            downstreamCalls++;

            return 'ok';
        }));

        await app.fetch(createTestRequest('/'));

        expect(downstreamCalls).toBe(1);
        expect(first).toBeInstanceOf(Response);
        expect(second).toBe(first);
    });

    it('should hand an error passed to next() to a later error handler', async () => {
        const app = new App();
        let received: Error | undefined;

        app.use(defineCoreHandler((event) => event.next(new Error('test error'))));

        app.get('/', defineCoreHandler(() => 'skipped'));

        app.use(defineErrorHandler((error) => {
            received = error;

            return 'handled';
        }));

        const response = await app.fetch(createTestRequest('/'));

        expect(received).toBeInstanceOf(Error);
        expect(received!.message).toBe('test error');
        expect(await response.text()).toBe('handled');
    });

    it('should expose the options of the App to the handler event', async () => {
        const app = new App({ options: { subdomainOffset: 5 } });

        app.get('/', defineCoreHandler((event) => event.appOptions.subdomainOffset));

        const response = await app.fetch(createTestRequest('/'));

        expect(await response.text()).toBe('5');
    });

    it('should keep the request signal on the handler event without a timeout', async () => {
        const app = new App();
        const request = createTestRequest('/');
        let same = false;

        app.get('/', defineCoreHandler((event) => {
            same = event.signal === request.signal;

            return 'ok';
        }));

        await app.fetch(request);

        expect(same).toBe(true);
    });

    it('should abort the handler signal with the request reason under a global timeout', async () => {
        const app = new App({ options: { timeout: 1000 } });
        const controller = new AbortController();
        const request = createTestRequest('/', { signal: controller.signal });
        let signal: AbortSignal | undefined;

        app.get('/', defineCoreHandler((event) => {
            ({ signal } = event);

            return 'ok';
        }));

        await app.fetch(request);

        expect(signal!.aborted).toBe(false);

        // The link outlives fetch(): a body streamed after the handler
        // returned still observes the client going away.
        controller.abort(new Error('client gone'));

        expect(signal!.aborted).toBe(true);
        expect((signal!.reason as Error).message).toBe('client gone');
    });
});
