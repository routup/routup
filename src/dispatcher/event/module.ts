import { MethodName } from '../../constants';
import { nextPlaceholder } from '../../utils';
import type { DispatcherEvent } from './types';

type DispatcherEventCreateContext = Pick<DispatcherEvent, 'request' | 'response'> &
Partial<Omit<DispatcherEvent, 'request' | 'response'>>;
export function createDispatcherEvent(
    input: DispatcherEventCreateContext,
) : DispatcherEvent {
    return {
        method: MethodName.GET,
        methodsAllowed: [],
        dispatched: false,
        mountPath: '/',
        params: {},
        path: '/',
        routerPath: [],
        next: nextPlaceholder,
        ...input,
    };
}
