import type { ServerRequest } from 'srvx';

/**
 * Create a mock ServerRequest for testing.
 * Wraps a standard Request with srvx-like properties.
 */
export function createTestRequest(
    url: string,
    options?: RequestInit & { ip?: string },
): ServerRequest {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    const request = new Request(fullUrl, options) as ServerRequest;

    if (options?.ip) {
        request.ip = options.ip;
    }

    return request;
}
