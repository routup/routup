import { isObject } from '../../utils';
import { isDispatcherMeta } from '../meta';
import type { DispatcherEvent } from './types';

export function isDispatcherEvent(input: unknown) : input is DispatcherEvent {
    return isObject(input) &&
        isObject(input.req) &&
        isObject(input.res) &&
        isDispatcherMeta(input.meta);
}
