import type { AppRequest } from '../src/index';
import { DispatcherEvent } from '../src/dispatcher/module';
import type { AppEvent } from '../src/event/module';

/**
 * Create a mock ServerRequest for testing.
 * Wraps a standard Request with srvx-like properties.
 */
export function createTestRequest(
    url: string,
    options?: RequestInit & { ip?: string },
): AppRequest {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    const request = new Request(fullUrl, options) as AppRequest;

    if (options?.ip) {
        request.ip = options.ip;
    }

    return request;
}

/**
 * Create a AppEvent for testing helpers.
 * Shorthand for creating a DispatcherEvent and building the public event.
 */
export function createTestEvent(
    url: string,
    options?: RequestInit & { ip?: string },
): AppEvent {
    return new DispatcherEvent(createTestRequest(url, options)).build();
}
