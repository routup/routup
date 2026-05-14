import { describe, expect, it } from 'vitest';
import { DispatcherEvent } from '../../../src/dispatcher/module';
import { AppEvent } from '../../../src/event/module';
import { createTestRequest } from '../../helpers';

describe('src/dispatcher/module (DispatcherEvent)', () => {
    it('should initialize with correct properties', () => {
        const event = new DispatcherEvent(createTestRequest('http://localhost/foo?bar=baz'));

        expect(event.method).toBe('GET');
        expect(event.path).toBe('/foo');
        expect(event.mountPath).toBe('/');
        expect(event.params).toEqual({});
        expect(event.dispatched).toBe(false);
    });

    it('should lazily initialize response accumulator', () => {
        const event = new DispatcherEvent(createTestRequest('/'));

        const res = event.response;
        expect(res.status).toBe(200);
        expect(res.headers).toBeInstanceOf(Headers);

        // Same instance on second access
        expect(event.response).toBe(res);
    });

    describe('setNext', () => {
        it('should set continuation that converts return values via toResponse', async () => {
            const event = new DispatcherEvent(createTestRequest('/'));
            event.setNext(() => 'hello');

            const routup = event.build();
            const response = await routup.next();
            expect(response).toBeInstanceOf(Response);
            expect(await response!.text()).toBe('hello');
        });

        it('should replace previous continuation', async () => {
            const event = new DispatcherEvent(createTestRequest('/'));
            event.setNext(() => new Response('original'));
            event.setNext(() => new Response('replaced'));

            const routup = event.build();
            const response = await routup.next();
            expect(response).toBeInstanceOf(Response);
            expect(await response!.text()).toBe('replaced');
        });

        it('should clear continuation when called with undefined', async () => {
            const event = new DispatcherEvent(createTestRequest('/'));
            event.setNext(() => new Response('set'));
            event.setNext(undefined);

            const routup = event.build();
            const response = await routup.next();
            expect(response).toBeUndefined();
        });

        it('should reset cache so new fn fires after re-setting', async () => {
            const event = new DispatcherEvent(createTestRequest('/'));
            event.setNext(() => new Response('first'));

            const routup1 = event.build();
            await routup1.next();

            event.setNext(() => new Response('second'));
            const routup2 = event.build();
            const response = await routup2.next();
            expect(await response!.text()).toBe('second');
        });

        it('should pass error to fn', async () => {
            const event = new DispatcherEvent(createTestRequest('/'));
            let receivedError: Error | undefined;

            event.setNext((error) => {
                receivedError = error;
                return new Response('handled');
            });

            const routup = event.build();
            await routup.next(new Error('test error'));
            expect(receivedError).toBeInstanceOf(Error);
            expect(receivedError!.message).toBe('test error');
        });
    });

    describe('build', () => {
        it('should create a AppEvent with shared references', () => {
            const dispatch = new DispatcherEvent(createTestRequest('http://localhost/test'));
            dispatch.response.status = 201;

            const routup = dispatch.build();

            expect(routup).toBeInstanceOf(AppEvent);
            expect(routup.request).toBe(dispatch.request);
            expect(routup.params).toBe(dispatch.params);
            expect(routup.path).toBe(dispatch.path);
            expect(routup.method).toBe(dispatch.method);
            expect(routup.mountPath).toBe(dispatch.mountPath);
            expect(routup.response).toBe(dispatch.response);
            expect(routup.response.status).toBe(201);
        });

        it('should provide headers from request', () => {
            const dispatch = new DispatcherEvent(createTestRequest('/', { headers: { 'x-custom': 'value' } }));
            const routup = dispatch.build();

            expect(routup.headers.get('x-custom')).toBe('value');
        });

        it('should parse searchParams', () => {
            const dispatch = new DispatcherEvent(createTestRequest('http://localhost/foo?a=1&b=2'));
            const routup = dispatch.build();

            expect(routup.searchParams.get('a')).toBe('1');
            expect(routup.searchParams.get('b')).toBe('2');
        });

        it('should have an isolated store per event', () => {
            const dispatch1 = new DispatcherEvent(createTestRequest('/'));
            const dispatch2 = new DispatcherEvent(createTestRequest('/'));

            const routup1 = dispatch1.build();
            const routup2 = dispatch2.build();

            routup1.store.foo = 'bar';

            expect(routup1.store.foo).toBe('bar');
            expect(routup2.store.foo).toBeUndefined();
        });

        it('should have a prototype-free store', () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));
            const routup = dispatch.build();

            expect(routup.store.toString).toBeUndefined();
            expect(routup.store.hasOwnProperty).toBeUndefined();
        });

        it('should support symbol keys in store', () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));
            const routup = dispatch.build();
            const key = Symbol.for('test:key');

            routup.store[key] = 42;
            expect(routup.store[key]).toBe(42);
        });

        it('should share store between builds', () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));

            const routup1 = dispatch.build();
            routup1.store.shared = 'yes';

            const routup2 = dispatch.build();
            expect(routup2.store.shared).toBe('yes');
        });

        it('should lazily resolve appOptions', () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));
            dispatch.appPath = [{ options: { subdomainOffset: 5 } }];

            const routup = dispatch.build();

            expect(routup.appOptions.subdomainOffset).toBe(5);
            expect(typeof routup.appOptions.trustProxy).toBe('function');
        });

        it('should cache next() result on repeated calls', async () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));
            let callCount = 0;
            dispatch.setNext(async () => {
                callCount++;
                return new Response('ok');
            });

            const routup = dispatch.build();
            const first = await routup.next();
            const second = await routup.next();

            expect(callCount).toBe(1);
            expect(first).toBe(second);
        });

        it('should return undefined from next() when no continuation set', async () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));
            const routup = dispatch.build();

            const result = await routup.next();
            expect(result).toBeUndefined();
        });

        it('should delegate next() to dispatch event', async () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));

            dispatch.setNext(() => new Response('from-dispatch'));

            const routup = dispatch.build();
            const response = await routup.next();

            expect(response).toBeInstanceOf(Response);
            expect(await response!.text()).toBe('from-dispatch');
        });

        it('should not expose internal properties', () => {
            const dispatch = new DispatcherEvent(createTestRequest('/'));
            const routup = dispatch.build();

            expect('dispatched' in routup).toBe(false);
            expect('error' in routup).toBe(false);
            expect('appPath' in routup).toBe(false);
            expect('methodsAllowed' in routup).toBe(false);
            expect('setNext' in routup).toBe(false);
        });
    });
});
