import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { App, defineCoreHandler, fromNodeMiddleware } from 'routup';

function requestId(_req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) {
    res.setHeader('X-Request-Id', randomUUID());
    next();
}

export const app = new App();

app.use(fromNodeMiddleware(requestId));

app.get('/', defineCoreHandler(() => 'Hello'));
