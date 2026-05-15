const runtime = typeof Bun !== 'undefined' ? 'bun' : 'node';
const {
    App,
    LinearRouter,
    LruCache,
    TrieRouter,
    defineCoreHandler,
    serve,
} = await import(`../dist/${runtime}.mjs`);

const RESOLVER = process.env.RESOLVER ?? 'linear';
const CACHE = process.env.CACHE ?? 'lru';

const cache = CACHE === 'none' ? null : new LruCache();

const buildRouter = () => {
    switch (RESOLVER) {
        case 'trie': return new TrieRouter({ cache });
        case 'linear':
        default: return new LinearRouter({ cache });
    }
};

const app = new App({
    etag: false,
    router: buildRouter(),
});

const noise = [
    '/users',
    '/users/:id',
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

for (const p of noise) {
    app.get(p, defineCoreHandler(() => ({ p })));
}

app.get('/', defineCoreHandler(() => ({ hello: 'world' })));

serve(app, { port: 3000, hostname: '127.0.0.1' });
