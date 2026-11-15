import { App, defineCoreHandler } from 'routup';

export type RequestLine = {
    method: string;
    path: string;
};

export type RequestLineResult = {
    status: number;
    body: string;
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const LINE_PATTERN = /^(?:(\S+)\s+)?(\/\S*)$/;

export const DEFAULT_REQUEST = 'GET /users/42';

export const DEFAULT_RESULT: RequestLineResult = { status: 200, body: '{ "id": 42 }' };

/**
 * Parse `METHOD /path` or `/path` (method defaults to GET).
 * Returns undefined for anything else.
 */
export function parseRequestLine(input: string): RequestLine | undefined {
    const match = LINE_PATTERN.exec(input.trim());

    if (!match) {
        return undefined;
    }

    const method = (match[1] ?? 'GET').toUpperCase();

    if (!METHODS.includes(method)) {
        return undefined;
    }

    return { method, path: match[2] as string };
}

/**
 * The app of the hero sample: one route, GET /users/:id.
 */
export function createDemoApp(): App {
    const app = new App();

    app.get('/users/:id', defineCoreHandler((event) => ({ id: Number(event.params.id) })));

    return app;
}

function formatBody(text: string, contentType: string | null): string {
    if (!contentType || !contentType.includes('json')) {
        return text;
    }

    try {
        // Indent by one space, then fold the lines: { "id": 42 }
        return JSON.stringify(JSON.parse(text), null, 1).replace(/\n\s*/g, ' ');
    } catch {
        return text;
    }
}

export async function runRequestLine(app: App, line: RequestLine): Promise<RequestLineResult> {
    const response = await app.fetch(new Request(new URL(line.path, 'http://localhost'), { method: line.method }));
    const text = await response.text();

    return {
        status: response.status,
        body: formatBody(text, response.headers.get('content-type')),
    };
}
