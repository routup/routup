import { App, AppError, defineCoreHandler } from 'routup';

type User = {
    name: string,
};

const TOKEN = 'secret-token';
const USER = Symbol('user');

export const app = new App();

app.get('/health', defineCoreHandler(() => ({ status: 'ok' })));

app.use(defineCoreHandler((event) => {
    if (event.headers.get('authorization') !== `Bearer ${TOKEN}`) {
        throw new AppError({ status: 401, message: 'Unauthorized' });
    }

    event.store[USER] = { name: 'Alice' } satisfies User;

    return event.next();
}));

app.get('/me', defineCoreHandler((event) => {
    const user = event.store[USER] as User;

    return { name: user.name };
}));
