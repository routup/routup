import { App, defineCoreHandler } from 'routup';

export const app = new App();

app.get('/', defineCoreHandler(() => 'Hello from Workers'));
