import type { MethodName } from '../constants';
import type { HookErrorListener, HookEventListener } from '../hook';
import type { Path } from '../path';

export type HandlerBaseConfig = {
    method?: `${MethodName}` | `${Uppercase<MethodName>}`,
    path?: Path,
    onError?: HookErrorListener,
    onBefore?: HookEventListener,
    onAfter?: HookEventListener
};
