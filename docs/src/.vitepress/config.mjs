import { defineRoutupConfig } from '@routup/docs-theme/config';

export default defineRoutupConfig({
    vite: { ssr: { noExternal: ['routup'] } },
    title: 'Routup',
    description: 'A minimalistic, runtime-agnostic HTTP routing framework built on srvx and Web Standards. Runs on Node.js, Bun, Deno, and Cloudflare Workers.',
    base: '/',
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: 'localhostLinks',

    head: [
        ['link', {
            rel: 'icon',
            type: 'image/svg+xml',
            href: '/logo.svg',
        }],
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'Routup — runtime-agnostic HTTP routing' }],
        ['meta', {
            property: 'og:description',
            content: 'A minimalistic, runtime-agnostic HTTP routing framework built on srvx and Web Standards.',
        }],
    ],

    themeConfig: {
        logo: '/logo.svg',
        search: { provider: 'local' },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/routup/routup' },
        ],
        editLink: {
            pattern: 'https://github.com/routup/routup/edit/master/docs/src/:path',
            text: 'Edit this page on GitHub',
        },
        nav: [
            {
                text: 'Guide',
                link: '/guide/',
                activeMatch: '/guide/',
            },
            {
                text: 'Examples',
                link: '/examples/',
                activeMatch: '/examples/',
            },
            {
                text: 'API',
                link: '/api/',
                activeMatch: '/api/',
            },
            {
                text: 'Plugins',
                link: 'https://plugins.routup.dev',
            },
        ],
        rtFooter: {
            tagline: 'Minimal HTTP routing on Web standards.',
            columns: [
                {
                    title: 'Docs',
                    links: [
                        { text: 'Quickstart', link: '/guide/quickstart' },
                        { text: 'Guide', link: '/guide/' },
                        { text: 'Examples', link: '/examples/' },
                        { text: 'API', link: '/api/' },
                        { text: 'Migrating to v6', link: '/guide/migration-v6' },
                    ],
                },
                {
                    title: 'Ecosystem',
                    links: [
                        { text: 'Plugins', link: 'https://plugins.routup.dev' },
                        { text: 'Templates', link: 'https://github.com/routup/templates' },
                        { text: 'GitHub', link: 'https://github.com/routup/routup' },
                    ],
                },
                {
                    title: 'Project',
                    links: [
                        { text: 'Releases', link: 'https://github.com/routup/routup/releases' },
                        { text: 'Issues', link: 'https://github.com/routup/routup/issues' },
                        { text: 'License', link: 'https://github.com/routup/routup/blob/master/LICENSE' },
                    ],
                },
            ],
            note: 'MIT licensed',
        },
        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'What is it?', link: '/guide/' },
                        { text: 'Quickstart', link: '/guide/quickstart' },
                        { text: 'Installation', link: '/guide/installation' },
                    ],
                },
                {
                    text: 'Essentials',
                    items: [
                        { text: 'App', link: '/guide/app' },
                        { text: 'Handlers', link: '/guide/handlers' },
                        { text: 'Request', link: '/guide/request' },
                        { text: 'Response', link: '/guide/response' },
                        { text: 'Helpers', link: '/guide/helpers' },
                        { text: 'Paths', link: '/guide/paths' },
                        { text: 'Plugins', link: '/guide/plugins' },
                        { text: 'Error Handling', link: '/guide/error-handling' },
                    ],
                },
                {
                    text: 'Advanced',
                    items: [
                        { text: 'Middleware Patterns', link: '/guide/middleware-patterns' },
                        { text: 'Lifecycle Callbacks', link: '/guide/lifecycle-callbacks' },
                        { text: 'Timeouts and Cancellation', link: '/guide/timeouts' },
                        { text: 'Testing', link: '/guide/testing' },
                        { text: 'Serving', link: '/guide/dispatchers' },
                        { text: 'Runtime Environments', link: '/guide/runtime-environments' },
                        { text: 'Custom Router', link: '/guide/custom-router' },
                        { text: 'Custom Cache', link: '/guide/custom-cache' },
                    ],
                },
                {
                    text: 'Plugin Authoring',
                    items: [
                        { text: 'Overview', link: '/guide/plugin-authoring/' },
                        { text: 'Conventions', link: '/guide/plugin-authoring/conventions' },
                    ],
                },
                {
                    text: 'Migration',
                    items: [
                        { text: 'Express Compatibility', link: '/guide/express-compatibility' },
                        { text: 'Migrating to v5', link: '/guide/migration-v5' },
                        { text: 'Migrating to v6', link: '/guide/migration-v6' },
                    ],
                },
            ],
            '/examples/': [
                {
                    text: 'Overview',
                    items: [
                        { text: 'All Examples', link: '/examples/' },
                    ],
                },
                {
                    text: 'Examples',
                    items: [
                        { text: 'REST API', link: '/examples/rest-api' },
                        { text: 'Auth Middleware', link: '/examples/auth-middleware' },
                        { text: 'JSON Errors', link: '/examples/json-errors' },
                        { text: 'Server-Sent Events', link: '/examples/server-sent-events' },
                        { text: 'Modular Apps', link: '/examples/modular-apps' },
                        { text: 'Static Files', link: '/examples/static-files' },
                        { text: 'Express Middleware', link: '/examples/express-middleware' },
                        { text: 'Cloudflare Workers', link: '/examples/cloudflare-workers' },
                    ],
                },
            ],
            '/api/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'Overview', link: '/api/' },
                    ],
                },
                {
                    text: 'Core',
                    items: [
                        { text: 'App', link: '/api/app' },
                        { text: 'Handlers', link: '/api/handlers' },
                        { text: 'Event', link: '/api/event' },
                        { text: 'Errors', link: '/api/errors' },
                        { text: 'Routers', link: '/api/routers' },
                    ],
                },
                {
                    text: 'Helpers',
                    items: [
                        { text: 'Request', link: '/api/request-helpers' },
                        { text: 'Response', link: '/api/response-helpers' },
                    ],
                },
                {
                    text: 'Advanced',
                    items: [
                        { text: 'Building Blocks', link: '/api/advanced' },
                    ],
                },
            ],
        },
    },
});
