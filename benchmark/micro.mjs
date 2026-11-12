/**
 * In-process dispatch benchmark — calls `app.fetch()` directly, without
 * a socket, so the number reflects routup's own per-request work
 * (event setup, lookup, pipeline walk, response building) instead of
 * the network stack. Use `benchmark/run.mjs` / `benchmark/compare.mjs`
 * for end-to-end req/s.
 *
 * Every scenario runs in its own process: sharing one lets the JIT
 * feedback of one scenario skew the next by double-digit percent.
 *
 *   npm run build:js && node benchmark/micro.mjs
 *
 * Compare two builds (runs alternate, so background load hits both):
 *
 *   BASE=node_modules/.cache/dist-baseline node benchmark/micro.mjs
 *
 * Env: DIST (build to measure, default dist), BASE (build to compare
 * against), TRIALS (5), ITERATIONS (300000), WARMUP (100000), ROUNDS
 * (2, compare mode only), SCENARIO (substring filter).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const {
    App,
    TrieRouter,
    defineCoreHandler,
    defineErrorHandler,
} = await import(`../${process.env.DIST ?? 'dist'}/node.mjs`);

function readPositiveInteger(name, fallback) {
    const raw = process.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`Invalid ${name}: "${raw}". Expected a positive integer.`);
    }

    return value;
}

const TRIALS = readPositiveInteger('TRIALS', 5);
const ROUNDS = readPositiveInteger('ROUNDS', 2);
const ITERATIONS = readPositiveInteger('ITERATIONS', 300_000);
const WARMUP = readPositiveInteger('WARMUP', 100_000);
const FILTER = process.env.SCENARIO;

const noise = [
    '/users',
    '/users/:id/posts',
    '/users/:id/posts/:postId',
    '/products',
    '/products/:id',
    '/products/:id/reviews',
    '/orders',
    '/orders/:id',
    '/orders/:id/items',
    '/orders/:id/items/:itemId',
    '/api/v1/health',
    '/api/v1/status',
    '/api/v1/metrics',
    '/api/v2/health',
    '/api/v2/status',
    '/api/v2/users/:id',
    '/admin/dashboard',
    '/admin/users',
    '/admin/users/:id',
    '/admin/settings',
    '/static/assets/:file',
    '/blog/:slug',
    '/blog/:slug/comments',
    '/search',
    '/categories',
    '/categories/:id',
    '/tags',
    '/tags/:tag',
];

function buildApp({
    router, 
    middleware = 0, 
    etag = false, 
} = {}) {
    const app = new App({ options: { etag }, router });

    for (let i = 0; i < middleware; i++) {
        app.use(defineCoreHandler((event) => event.next()));
    }

    for (const p of noise) {
        app.get(p, defineCoreHandler(() => ({ p })));
    }

    app.get('/', defineCoreHandler(() => ({ hello: 'world' })));
    app.get('/text', defineCoreHandler(() => 'hello world'));
    app.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));
    app.get('/query', defineCoreHandler((event) => ({ q: event.searchParams.get('q') })));
    app.get('/response', defineCoreHandler(() => new Response('ok')));
    app.get('/async', defineCoreHandler(async () => ({ hello: 'world' })));
    app.get('/throw', defineCoreHandler(() => {
        throw new Error('boom');
    }));
    app.use(defineErrorHandler((error) => ({ message: error.message })));

    return app;
}

const request = (path, init) => new Request(`http://127.0.0.1:3000${path}`, init);

const scenarios = [
    {
        name: 'static json GET /', 
        app: buildApp(), 
        request: request('/'),
    },
    {
        name: 'static text GET /text', 
        app: buildApp(), 
        request: request('/text'),
    },
    {
        name: 'param GET /users/:id', 
        app: buildApp(), 
        request: request('/users/42'),
    },
    {
        name: 'query GET /query?q=1', 
        app: buildApp(), 
        request: request('/query?q=1'),
    },
    {
        name: 'Response GET /response', 
        app: buildApp(), 
        request: request('/response'),
    },
    {
        name: 'async json GET /async', 
        app: buildApp(), 
        request: request('/async'),
    },
    {
        name: '3 middleware + json GET /', 
        app: buildApp({ middleware: 3 }), 
        request: request('/'),
    },
    {
        name: 'trie static json GET /', 
        app: buildApp({ router: new TrieRouter() }), 
        request: request('/'),
    },
    {
        name: 'trie param GET /users/:id', 
        app: buildApp({ router: new TrieRouter() }), 
        request: request('/users/42'),
    },
    {
        name: 'etag json GET /', 
        app: buildApp({ etag: true }), 
        request: request('/'),
    },
    {
        name: 'error handler GET /throw', 
        app: buildApp(), 
        request: request('/throw'),
    },
    {
        name: '404 GET /missing', 
        app: buildApp(), 
        request: request('/missing'),
    },
].filter((s) => !FILTER || s.name.includes(FILTER));

async function loop(app, req, n) {
    for (let i = 0; i < n; i++) {
        await app.fetch(req);
    }
}

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);

    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function measure(scenario) {
    await loop(scenario.app, scenario.request, WARMUP);

    const samples = [];

    for (let t = 0; t < TRIALS; t++) {
        const start = process.hrtime.bigint();

        await loop(scenario.app, scenario.request, ITERATIONS);

        const elapsedNs = Number(process.hrtime.bigint() - start);

        samples.push(ITERATIONS / (elapsedNs / 1e9));
    }

    return Math.round(median(samples));
}

function measureInChild(name, dist) {
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
        env: {
            ...process.env,
            DIST: dist,
            MICRO_CHILD: name,
        },
        encoding: 'utf8',
    });

    if (child.status !== 0) {
        throw new Error(`${name} (${dist}) failed:\n${child.stderr}`);
    }

    return Number(child.stdout.trim());
}

if (process.env.MICRO_CHILD) {
    const scenario = scenarios.find((s) => s.name === process.env.MICRO_CHILD);

    console.log(await measure(scenario));
} else {
    const DIST = process.env.DIST ?? 'dist';
    const { BASE } = process.env;

    for (const { name } of scenarios) {
        if (!BASE) {
            console.log(`${name.padEnd(30)} ${String(measureInChild(name, DIST)).padStart(9)} ops/s`);

            continue;
        }

        const base = [];
        const head = [];

        for (let r = 0; r < ROUNDS; r++) {
            base.push(measureInChild(name, BASE));
            head.push(measureInChild(name, DIST));
        }

        const b = median(base);
        const h = median(head);

        console.log(
            `${name.padEnd(30)} base ${String(Math.round(b)).padStart(8)}  head ${String(Math.round(h)).padStart(8)} ops/s` +
            `  ${h >= b ? '+' : ''}${((h / b - 1) * 100).toFixed(1)}%`,
        );
    }
}
