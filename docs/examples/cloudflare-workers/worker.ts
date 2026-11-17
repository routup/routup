import { app } from './app.ts';

export default { fetch: (request: Request) => app.fetch(request) };
