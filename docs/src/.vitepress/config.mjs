import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Routup',
    base: '/',
    ignoreDeadLinks: 'localhostLinks',
    themeConfig: {
        socialLinks: [
            { icon: 'github', link: 'https://github.com/routup/routup' },
        ],
        editLink: {
            pattern: 'https://github.com/routup/docs/edit/master/docs/:path',
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
                text: 'API',
                link: '/api/',
                activeMatch: '/api/'
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
                    text: 'Essentials',
                    items: [
                        {text: 'Router', link: '/guide/router'},
                        {text: 'Handlers', link: '/guide/handlers'},
                        {text: 'Request', link: '/guide/request'},
                        {text: 'Response', link: '/guide/response'},
                        {text: 'Helpers', link: '/guide/helpers'},
                        {text: 'Paths', link: '/guide/paths'},
                        {text: 'Plugins', link: '/guide/plugins'},
                    ]
                },
                {
                    text: 'Advanced',
                    items: [
                        { text: 'Hooks', link: '/guide/hooks' },
                        { text: 'Dispatchers', link: '/guide/dispatchers' },
                        { text: 'Runtime Environments', link: '/guide/runtime-environments'}
                    ]
                },
                {
                    text: 'Recipes',
                    items: [
                        { text: 'Express Compatibility', link: '/guide/express-compatibility' }
                    ]
                }
            ],
            '/api/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'Overview', link: '/api/' },
                    ]
                },
                {
                    text: 'Helpers',
                    items: [
                        {text: 'Request', link: '/api/request-helpers'},
                        {text: 'Response', link: '/api/response-helpers'}
                    ]
                }
            ]
        }
    }
});
