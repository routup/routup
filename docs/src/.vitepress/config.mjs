import { defineConfig } from 'vitepress';

export default defineConfig({
    vite: { ssr: { noExternal: ['routup'] } },
    title: 'Routup',
    description: 'A minimalistic, runtime-agnostic HTTP routing framework built on srvx and Web Standards. Runs on Node.js, Bun, Deno, and Cloudflare Workers.',
    base: '/',
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: 'localhostLinks',

    head: [
        ['meta', { name: 'theme-color', content: '#7c3aed' }],
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'Routup — runtime-agnostic HTTP routing' }],
        ['meta', {
            property: 'og:description',
            content: 'A minimalistic, runtime-agnostic HTTP routing framework built on srvx and Web Standards.',
        }],
    ],

    themeConfig: {
        search: { provider: 'local' },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/routup/routup' },
        ],
        editLink: {
            pattern: 'https://github.com/routup/routup/edit/develop/docs/:path',
            text: 'Edit this page on GitHub',
        },
        nav: [
            {
                text: 'Home',
                link: '/',
                activeMatch: '/',
            },
            {
                text: 'Guide',
                link: '/guide/',
                activeMatch: '/guide/',
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
        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'What is it?', link: '/guide/' },
                        { text: 'Installation', link: '/guide/installation' },
                    ],
                },
                {
                    text: 'Essentials',
                    items: [
                        { text: 'Router', link: '/guide/router' },
                        { text: 'Handlers', link: '/guide/handlers' },
                        { text: 'Request', link: '/guide/request' },
                        { text: 'Response', link: '/guide/response' },
                        { text: 'Helpers', link: '/guide/helpers' },
                        { text: 'Paths', link: '/guide/paths' },
                        { text: 'Plugins', link: '/guide/plugins' },
                    ],
                },
                {
                    text: 'Advanced',
                    items: [
                        { text: 'Hooks', link: '/guide/hooks' },
                        { text: 'Serving', link: '/guide/dispatchers' },
                        { text: 'Runtime Environments', link: '/guide/runtime-environments' },
                    ],
                },
                {
                    text: 'Plugin Authoring',
                    items: [
                        { text: 'Overview', link: '/guide/plugin-authoring/' },
                        { text: 'Dependencies', link: '/guide/plugin-authoring/dependencies' },
                        { text: 'Conventions', link: '/guide/plugin-authoring/conventions' },
                    ],
                },
                {
                    text: 'Migration',
                    items: [
                        { text: 'Express Compatibility', link: '/guide/express-compatibility' },
                        { text: 'Migrating to v5', link: '/guide/migration-v5' },
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
                    text: 'Helpers',
                    items: [
                        { text: 'Request', link: '/api/request-helpers' },
                        { text: 'Response', link: '/api/response-helpers' },
                    ],
                },
            ],
        },
    },
});
