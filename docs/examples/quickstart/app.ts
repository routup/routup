import { App, defineCoreHandler } from 'routup';

export const app = new App();

app.get('/', defineCoreHandler(() => 'Hello, World!'));

app.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));
