export enum HookName {
    ERROR = 'error',

    DISPATCH_START = 'dispatchStart',
    DISPATCH_END = 'dispatchEnd',
    DISPATCH_FAIL = 'dispatchFail',

    HANDLER_BEFORE = 'handlerBefore',
    HANDLER_AFTER = 'HandlerAfter',

    // HANDLER_MATCH = 'handlerMatch', // todo: implement route match hook
    // ROUTER_MATCH = 'routerMatch',
}
