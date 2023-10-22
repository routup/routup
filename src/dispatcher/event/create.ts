import { DispatcherEvent } from './module';
import type { DispatcherEventCreateContext } from './types';

export function createDispatcherEvent(
    input: DispatcherEventCreateContext,
) : DispatcherEvent {
    return new DispatcherEvent({
        request: input.request,
        response: input.response,
        method: input.method,
        path: input.path,
    });
}
