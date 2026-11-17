import { fileURLToPath } from 'node:url';
import { App, defineCoreHandler } from 'routup';
import { assets } from '@routup/assets';

export const app = new App();

app.use(assets(fileURLToPath(new URL('public', import.meta.url)), {
    fallback: 'index.html',
    fallbackIgnores: ['^/api(/|$)'],
}));

app.get('/api/hello', defineCoreHandler(() => ({ message: 'Hello' })));
