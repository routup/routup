import type { MethodName } from '../constants';
import type { HookErrorFn, HookEventFn } from '../hook';
import type { Path } from '../path';

export type HandlerBaseConfig = {
    method?: `${MethodName}` | `${Uppercase<MethodName>}`,
    path?: Path,
    onError?: HookErrorFn,
    onBefore?: HookEventFn,
    onAfter?: HookEventFn
};
