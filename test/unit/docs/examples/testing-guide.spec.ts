import { describe, expect, it } from 'vitest';
import {
    App,
    AppError,
    defineCoreHandler,
    defineErrorHandler,
} from 'routup';

const users: Record<string, { name: string }> = { 1: { name: 'Alice' } };

const app = new App();

app.use(defineCoreHandler((event) => {
    event.response.headers.set('x-powered-by', 'routup');

    return event.next();
}));

app.get('/users/:id', defineCoreHandler((event) => {
    const user = users[event.params.id!];

    if (!user) {
        throw new AppError({ status: 404, message: 'User not found' });
    }

    return user;
}));

app.use(defineErrorHandler((error, event) => {
    event.response.status = error.status;

    return { error: error.message };
}));

describe('users app', () => {
    it('should answer a known user as JSON', async () => {
        const response = await app.fetch(new Request('http://localhost/users/1'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await response.json()).toEqual({ name: 'Alice' });
    });

    it('should set a header in the middleware', async () => {
        const response = await app.fetch(new Request('http://localhost/users/1'));

        expect(response.headers.get('x-powered-by')).toBe('routup');
    });

    it('should shape the error in the error handler', async () => {
        const response = await app.fetch(new Request('http://localhost/users/2'));

        expect(response.status).toBe(404);
        expect(response.headers.get('x-powered-by')).toBe('routup');
        expect(await response.json()).toEqual({ error: 'User not found' });
    });
});
