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
            '/plugins/cookie/': [
                {
                    text: 'Cookie',
                    collapsible: false,
                    items: [
                        {text: 'Introduction', link: '/plugins/cookie/'},
                        {text: 'Installation', link: '/plugins/cookie/installation.md'},
                        {text: 'Usage', link: '/plugins/cookie/usage.md'},
                        {text: 'API-Reference', link: '/plugins/cookie/api-reference.md'}
                    ]
                },
            ],
            '/plugins/query/': [
                {
                    text: 'Query',
                    collapsible: false,
                    items: [
                        {text: 'Introduction', link: '/plugins/query/'},
                        {text: 'Installation', link: '/plugins/query/installation.md'},
                        {text: 'Usage', link: '/plugins/query/usage.md'},
                        {text: 'API-Reference', link: '/plugins/query/api-reference.md'}
                    ]
                },
            ],
        }
    }
});
