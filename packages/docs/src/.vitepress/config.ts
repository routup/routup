import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Routup',
    base: '/',
    ignoreDeadLinks: 'localhostLinks',
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
                    { text: 'Decorators', link: '/plugins/decorators/' },
                    { text: 'Prometheus', link: '/plugins/prometheus/' },
                    { text: 'RateLimit', link: '/plugins/rate-limit/' },
                    { text: 'RateLimit Redis', link: '/plugins/rate-limit-redis/' },
                    { text: 'Query', link: '/plugins/query/' },
                    { text: 'Static', link: '/plugins/static/' },
                    { text: 'Swagger', link: '/plugins/swagger/' },
                ]
            }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
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
                    items: [
                        {text: 'Request Helpers', link: '/guide/api-reference-request-helpers'},
                        {text: 'Response Helpers', link: '/guide/api-reference-response-helpers'}
                    ]
                },
            ],
            '/plugins/body/': [
                {
                    text: '@routup/body',
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
                    items: [
                        {text: 'Introduction', link: '/plugins/cookie/'},
                        {text: 'Installation', link: '/plugins/cookie/installation.md'},
                        {text: 'Usage', link: '/plugins/cookie/usage.md'}
                    ]
                },
            ],
            '/plugins/decorators/': [
                {
                    text: '@routup/decorators',
                    items: [
                        {text: 'Introduction', link: '/plugins/decorators/'},
                        {text: 'Installation', link: '/plugins/decorators/installation.md'},
                        {text: 'Configuration', link: '/plugins/decorators/configuration.md'},
                        {text: 'Usage', link: '/plugins/decorators/usage.md'}
                    ]
                },
            ],
            '/plugins/prometheus/': [
                {
                    text: '@routup/prometheus',
                    items: [
                        {text: 'Introduction', link: '/plugins/prometheus/'},
                        {text: 'Installation', link: '/plugins/prometheus/installation.md'},
                        {text: 'Configuration', link: '/plugins/prometheus/configuration.md'},
                        {text: 'Usage', link: '/plugins/prometheus/usage.md'}
                    ]
                },
            ],
            '/plugins/query/': [
                {
                    text: '@routup/query',
                    items: [
                        {text: 'Introduction', link: '/plugins/query/'},
                        {text: 'Installation', link: '/plugins/query/installation.md'},
                        {text: 'Usage', link: '/plugins/query/usage.md'}
                    ]
                },
            ],
            '/plugins/rate-limit/': [
                {
                    text: '@routup/rate-limit',
                    items: [
                        {text: 'Introduction', link: '/plugins/rate-limit/'},
                        {text: 'Installation', link: '/plugins/rate-limit/installation.md'},
                        {text: 'Usage', link: '/plugins/rate-limit/usage.md'},
                        {text: 'API Reference', link: '/plugins/rate-limit/api-reference.md'}
                    ]
                },
            ],
            '/plugins/rate-limit-redis/': [
                {
                    text: '@routup/rate-limit-redis',
                    items: [
                        {text: 'Introduction', link: '/plugins/rate-limit-redis/'},
                        {text: 'Installation', link: '/plugins/rate-limit-redis/installation.md'},
                        {text: 'Usage', link: '/plugins/rate-limit-redis/usage.md'}
                    ]
                },
            ],
            '/plugins/static/': [
                {
                    text: '@routup/static',
                    items: [
                        {text: 'Introduction', link: '/plugins/static/'},
                        {text: 'Installation', link: '/plugins/static/installation.md'},
                        {text: 'Usage', link: '/plugins/static/usage.md'}
                    ]
                },
            ],
            '/plugins/swagger/': [
                {
                    text: '@routup/swagger',
                    items: [
                        {text: 'Introduction', link: '/plugins/swagger/'},
                        {text: 'Installation', link: '/plugins/swagger/installation.md'},
                        {text: 'Usage', link: '/plugins/swagger/usage.md'}
                    ]
                },
            ],
        }
    }
});
