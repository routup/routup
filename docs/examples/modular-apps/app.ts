import { App, defineCoreHandler } from 'routup';

export const users = new App();

users.get('/:id', defineCoreHandler((event) => ({
    id: event.params.id,
    name: 'Alice',
})));

export const posts = new App();

posts.get('/:id', defineCoreHandler((event) => ({
    id: event.params.id,
    title: 'Hello',
})));

export const app = new App();

app.use('/users', users);
app.use('/posts', posts);
