import type { AppRequest } from '../src/index';
import { PipelineStep } from '../src/app/pipeline';
import { PipelineState } from '../src/app/pipeline-state';
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
 * Builds the event of a standalone pipeline step: no match is left,
 * so `event.next()` resolves with `undefined`.
 */
export function createTestEvent(
    url: string,
    options?: RequestInit & { ip?: string },
): AppEvent {
    const state = new PipelineState(createTestRequest(url, options));

    return new PipelineStep(state, [], 0).createEvent();
}
