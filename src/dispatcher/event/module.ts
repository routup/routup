import { MethodName } from '../../constants';
import { nextPlaceholder } from '../../utils';
import type { DispatcherEvent } from './types';

type DispatcherEventCreateContext = Pick<DispatcherEvent, 'req' | 'res'> &
Partial<Omit<DispatcherEvent, 'req' | 'res'>>;
export function createDispatcherEvent(
    input: DispatcherEventCreateContext,
) : DispatcherEvent {
    return {
        method: MethodName.GET,
        mountPath: '/',
        params: {},
        path: '/',
        routerPath: [],
        next: nextPlaceholder,
        ...input,
    };
}
