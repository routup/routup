import { describe, expect, it } from 'vitest';
import type { AppEventRoute, Handler, IAppEvent } from '../../../src';
import {
    App,
    AppError,
    LinearRouter,
    TrieRouter,
    defineCoreHandler,
    defineErrorHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

type Observed = {
    before: AppEventRoute | undefined,
    after: AppEventRoute | undefined,
};

/**
 * Middleware that records `event.route` before and after it called
 * `event.next()`, on its own event object.
 */
function observe(observed: Observed[]) {
    return defineCoreHandler(async (event) => {
        const entry: Observed = { before: event.route, after: undefined };

        observed.push(entry);

        const response = await event.next();

        entry.after = event.route;

        return response;
    });
}

function respondWithRoute(event: IAppEvent) {
    return event.route ?? null;
}

describe.each([
    ['LinearRouter', () => new LinearRouter<Handler>()],
    ['TrieRouter', () => new TrieRouter<Handler>()],
])('event.route (%s)', (_name, createRouter) => {
    it('should name a route registered directly', async () => {
        const app = new App({ router: createRouter() });

        app.get('/notes/:id', defineCoreHandler(respondWithRoute));

        const response = await app.fetch(createTestRequest('/notes/1'));

        expect(await response.json()).toEqual({
            path: '/notes/:id',
            pathPrefix: '/',
            method: 'GET',
        });
    });

    it('should include the App path option in the prefix', async () => {
        const app = new App({ router: createRouter(), path: '/api' });

        app.post('/notes', defineCoreHandler(respondWithRoute));

        const response = await app.fetch(createTestRequest('/api/notes', { method: 'POST' }));

        expect(await response.json()).toEqual({
            path: '/api/notes',
            pathPrefix: '/api',
            method: 'POST',
        });
    });

    it('should compose the prefix over nested mounts', async () => {
        const notes = new App();

        notes.get('/:id', defineCoreHandler(respondWithRoute));

        const v1 = new App();

        v1.use('/notes', notes);

        const app = new App({ router: createRouter() });

        app.use('/api/v1', v1);

        const response = await app.fetch(createTestRequest('/api/v1/notes/7'));

        expect(await response.json()).toEqual({
            path: '/api/v1/notes/:id',
            pathPrefix: '/api/v1/notes',
            method: 'GET',
        });
    });

    it('should compose the prefix over a child App path option', async () => {
        const child = new App({ path: '/v1' });

        child.get('/notes', defineCoreHandler(respondWithRoute));

        const app = new App({ router: createRouter() });

        app.use('/api', child);

        const response = await app.fetch(createTestRequest('/api/v1/notes'));

        expect(await response.json()).toEqual({
            path: '/api/v1/notes',
            pathPrefix: '/api/v1',
            method: 'GET',
        });
    });

    it('should keep a parameter of a mount path in the prefix pattern', async () => {
        const notes = new App();

        notes.get('/:id', defineCoreHandler(respondWithRoute));

        const app = new App({ router: createRouter() });

        app.use('/:tenant/notes', notes);

        const response = await app.fetch(createTestRequest('/acme/notes/1'));

        expect(await response.json()).toEqual({
            path: '/:tenant/notes/:id',
            pathPrefix: '/:tenant/notes',
            method: 'GET',
        });
    });

    it('should treat the path of use() as the prefix of a method-bound handler', async () => {
        const app = new App({ router: createRouter() });

        app.use('/api', defineCoreHandler({
            method: 'GET',
            path: '/notes',
            fn: respondWithRoute,
        }));

        const response = await app.fetch(createTestRequest('/api/notes'));

        expect(await response.json()).toEqual({
            path: '/api/notes',
            pathPrefix: '/api',
            method: 'GET',
        });
    });

    it('should name the GET route that serves a HEAD request', async () => {
        const observed: Observed[] = [];
        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.get('/notes', defineCoreHandler(() => 'ok'));

        const response = await app.fetch(createTestRequest('/notes', { method: 'HEAD' }));

        expect(response.status).toBe(200);
        expect(observed[0]!.after).toEqual({
            path: '/notes',
            pathPrefix: '/',
            method: 'GET',
        });
    });

    it('should be undefined for an OPTIONS request answered without a route', async () => {
        const observed: Observed[] = [];
        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.get('/notes', defineCoreHandler(() => 'ok'));

        const response = await app.fetch(createTestRequest('/notes', { method: 'OPTIONS' }));

        expect(response.headers.get('allow')).toBe('GET,HEAD');
        expect(observed).toHaveLength(1);
        expect(observed[0]!.after).toBeUndefined();
    });

    it('should be undefined for a request only middleware handled', async () => {
        const observed: Observed[] = [];
        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.get('/notes', defineCoreHandler(() => 'ok'));

        const response = await app.fetch(createTestRequest('/missing'));

        expect(response.status).toBe(404);
        expect(observed[0]!.after).toBeUndefined();
    });

    it('should be undefined for a method-less mount', async () => {
        const observed: Observed[] = [];
        const assets = new App();

        assets.use(defineCoreHandler((event) => `asset ${event.route === undefined}`));

        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.use('/assets', assets);

        const response = await app.fetch(createTestRequest('/assets/app.js'));

        expect(await response.text()).toBe('asset true');
        expect(observed[0]!.after).toBeUndefined();
    });

    it('should be undefined before next() and the endpoint after it', async () => {
        const observed: Observed[] = [];
        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.use('/api', observe(observed));
        app.get('/api/notes/:id', defineCoreHandler(() => 'ok'));

        const response = await app.fetch(createTestRequest('/api/notes/1'));

        expect(response.status).toBe(200);
        expect(observed).toHaveLength(2);

        const expected = {
            path: '/api/notes/:id',
            pathPrefix: '/',
            method: 'GET',
        };

        for (const entry of observed) {
            expect(entry.before).toBeUndefined();
            expect(entry.after).toEqual(expected);
        }
    });

    it('should name the later route after next() fell through to it', async () => {
        const observed: Observed[] = [];
        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.get('/notes/latest', defineCoreHandler((event) => event.next()));
        app.get('/notes/:id', defineCoreHandler(respondWithRoute));

        const response = await app.fetch(createTestRequest('/notes/latest'));

        const expected = {
            path: '/notes/:id',
            pathPrefix: '/',
            method: 'GET',
        };

        expect(await response.json()).toEqual(expected);
        expect(observed[0]!.after).toEqual(expected);
    });

    it('should name the route that threw while an error handler answers', async () => {
        const observed: Observed[] = [];
        const app = new App({ router: createRouter() });

        app.use(observe(observed));
        app.get('/notes/:id', defineCoreHandler(() => {
            throw new AppError({ status: 409, message: 'conflict' });
        }));
        app.use(defineErrorHandler((_error, event) => respondWithRoute(event)));

        const response = await app.fetch(createTestRequest('/notes/1'));

        const expected = {
            path: '/notes/:id',
            pathPrefix: '/',
            method: 'GET',
        };

        expect(await response.json()).toEqual(expected);
        expect(observed[0]!.after).toEqual(expected);
    });

    it('should name a controller route mounted through a child App per base path', async () => {
        const observed: Observed[] = [];

        // The shape `@routup/decorators` builds: a method middleware
        // registered as a method-bound route with the endpoint's
        // pattern, then the endpoint, on one child App mounted under
        // each base path of the controller.
        const controller = new App();

        controller.use(defineCoreHandler({
            method: 'get',
            path: '/:id',
            fn: async (event) => {
                observed.push({ before: event.route, after: undefined });

                return event.next();
            },
        }));
        controller.use(defineCoreHandler({
            method: 'get',
            path: '/:id',
            fn: respondWithRoute,
        }));

        const app = new App({ router: createRouter() });

        app.use('/notes', controller);
        app.use('/memos', controller);

        let response = await app.fetch(createTestRequest('/notes/1'));

        const notes = {
            path: '/notes/:id',
            pathPrefix: '/notes',
            method: 'GET',
        };

        expect(await response.json()).toEqual(notes);
        expect(observed[0]!.before).toEqual(notes);

        response = await app.fetch(createTestRequest('/memos/1'));

        const memos = {
            path: '/memos/:id',
            pathPrefix: '/memos',
            method: 'GET',
        };

        expect(await response.json()).toEqual(memos);
        expect(observed[1]!.before).toEqual(memos);
    });

    it('should keep one value per request and share none between requests', async () => {
        const seen: (AppEventRoute | undefined)[][] = [];
        const app = new App({ router: createRouter() });

        app.use(defineCoreHandler(async (event) => {
            const reads: (AppEventRoute | undefined)[] = [];

            seen.push(reads);

            const response = await event.next();

            reads.push(event.route, event.route);

            return response;
        }));
        app.get('/notes', defineCoreHandler(() => 'ok'));

        await app.fetch(createTestRequest('/notes'));
        await app.fetch(createTestRequest('/notes'));

        expect(seen[0]![0]).toBeDefined();
        expect(seen[0]![1]).toBe(seen[0]![0]);
        expect(seen[1]![0]).toEqual(seen[0]![0]);
        expect(seen[1]![0]).not.toBe(seen[0]![0]);
    });

    it('should give independent Apps their own values', async () => {
        const createChild = () => {
            const child = new App({ router: createRouter() });

            child.get('/notes', defineCoreHandler(respondWithRoute));

            return child;
        };

        const a = createChild();
        const b = createChild();
        const parent = new App({ router: createRouter() });

        parent.use('/api', a);

        const own = {
            path: '/notes',
            pathPrefix: '/',
            method: 'GET',
        };

        let response = await parent.fetch(createTestRequest('/api/notes'));

        expect(await response.json()).toEqual({
            path: '/api/notes',
            pathPrefix: '/api',
            method: 'GET',
        });

        // The mounted child, used standalone, keeps its own value, as
        // does an independent App with the same routes.
        response = await a.fetch(createTestRequest('/notes'));
        expect(await response.json()).toEqual(own);

        response = await b.fetch(createTestRequest('/notes'));
        expect(await response.json()).toEqual(own);

        expect(a.routes[0]!.pathPrefix).toBe('/');
        expect(parent.routes[0]!.pathPrefix).toBe('/api');
    });
});
