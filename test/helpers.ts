import type { RoutupRequest } from '../src/index';

/**
 * Create a mock ServerRequest for testing.
 * Wraps a standard Request with srvx-like properties.
 */
export function createTestRequest(
    url: string,
    options?: RequestInit & { ip?: string },
): RoutupRequest {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    const request = new Request(fullUrl, options) as RoutupRequest;

    if (options?.ip) {
        request.ip = options.ip;
    }

    return request;
}
