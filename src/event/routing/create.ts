import { MethodName } from '../../constants';
import { nextPlaceholder } from '../../utils';
import type { RoutingEvent } from './types';

type DispatcherEventCreateContext = Pick<RoutingEvent, 'request' | 'response'> &
Partial<Omit<RoutingEvent, 'request' | 'response'>>;

export function createRoutingEvent(
    input: DispatcherEventCreateContext,
): RoutingEvent {
    return {
        dispatched: false,
        method: MethodName.GET,
        mountPath: '/',
        params: {},
        path: '/',
        routerPath: [],
        next: nextPlaceholder,
        ...input,
    };
}
