import type { MethodName } from '../constants';
import type { HookDefaultListener, HookErrorListener } from '../hook';
import type { Path } from '../path';

export type HandlerBaseConfig = {
    method?: `${MethodName}` | `${Uppercase<MethodName>}`,
    path?: Path,
    onError?: HookErrorListener,
    onBefore?: HookDefaultListener,
    onAfter?: HookDefaultListener
};
