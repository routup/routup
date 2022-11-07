import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Routup',
    base: '/',
    themeConfig: {
        socialLinks: [
            { icon: 'github', link: 'https://github.com/tada5hi/routup' },
        ],
        editLink: {
            pattern: 'https://github.com/tada5hi/routup/edit/master/docs/:path',
            text: 'Edit this page on GitHub'
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
                text: 'Plugins',
                activeMatch: '/plugins/',
                items: [
                    { text: 'Body', link: '/plugins/body/' },
                    { text: 'Cookie', link: '/plugins/cookie/' },
                    { text: 'Query', link: '/plugins/query/' },
                ]
            }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
                    collapsible: false,
                    items: [
                        {text: 'What is it?', link: '/guide/'},
                        {text: 'Installation', link: '/guide/installation'},
                    ]
                },
                {
                    text: 'Getting Started',
                    items: [
                        {text: 'Router', link: '/guide/router'},
                        {text: 'Handler', link: '/guide/handler'},
                        {text: 'Middleware', link: '/guide/middleware'},
                        {text: 'Helpers', link: '/guide/helpers'},
                        {text: 'Mounting', link: '/guide/mounting'},
                        {text: 'Mounting Methods', link: '/guide/mounting-methods'},
                        {text: 'Mounting Paths', link: '/guide/mounting-paths'},
                        {text: 'Plugins', link: '/guide/plugins'},
                    ]
                },
                {
                    text: 'API Reference',
                    collapsible: false,
                    items: [
                        {text: 'Request Helpers', link: '/guide/api-reference-request-helpers'},
                        {text: 'Response Helpers', link: '/guide/api-reference-response-helpers'}
                    ]
                },
            ],
            '/plugins/body/': [
                {
                    text: '@routup/body',
                    collapsible: false,
                    items: [
                        {text: 'Introduction', link: '/plugins/body/'},
                        {text: 'Installation', link: '/plugins/body/installation.md'},
                        {text: 'Usage', link: '/plugins/body/usage.md'},
                        {text: 'Parser', link: '/plugins/body/parser.md'}
                    ]
                },
            ],
            '/plugins/cookie/': [
                {
                    text: '@routup/cookie',
                    collapsible: false,
                    items: [
                        {text: 'Introduction', link: '/plugins/cookie/'},
                        {text: 'Installation', link: '/plugins/cookie/installation.md'},
                        {text: 'Usage', link: '/plugins/cookie/usage.md'}
                    ]
                },
            ],
            '/plugins/query/': [
                {
                    text: '@routup/query',
                    collapsible: false,
                    items: [
                        {text: 'Introduction', link: '/plugins/query/'},
                        {text: 'Installation', link: '/plugins/query/installation.md'},
                        {text: 'Usage', link: '/plugins/query/usage.md'}
                    ]
                },
            ],
        }
    }
});
