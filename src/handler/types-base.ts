import type { MethodName } from '../constants.ts';
import type { HookDefaultListener, HookErrorListener } from '../hook/index.ts';
import type { Path } from '../path/index.ts';

export type HandlerBaseOptions = {
    method?: Uppercase<MethodName> | Lowercase<MethodName>,
    path?: Path,
    onError?: HookErrorListener,
    onBefore?: HookDefaultListener,
    onAfter?: HookDefaultListener
};
