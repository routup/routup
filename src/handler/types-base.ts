import type { MethodName } from '../constants.ts';
import type { HookDefaultListener, HookErrorListener } from '../hook/index.ts';
import type { Path } from '../path/index.ts';

export type HandlerBaseOptions = {
    method?: Uppercase<MethodName> | Lowercase<MethodName>,
    path?: Path,

    /**
     * Per-handler timeout in milliseconds.
     *
     * Overrides the router's `handlerTimeout` default. Whether this value
     * can extend or only narrow the default is controlled by the router's
     * `handlerTimeoutOverridable` option.
     */
    timeout?: number,
    onError?: HookErrorListener,
    onBefore?: HookDefaultListener,
    onAfter?: HookDefaultListener
};
