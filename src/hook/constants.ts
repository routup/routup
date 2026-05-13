export const HookName = {
    /**
     * Fired at the start of `Router.dispatch`, before the pipeline walk.
     * Once per router per request.
     */
    START: 'start',
    /**
     * Fired at the end of `Router.dispatch`, after the pipeline walk
     * (and OPTIONS auto-Allow synthesis) completes. Once per router per
     * request.
     */
    END: 'end',

    ERROR: 'error',

    CHILD_MATCH: 'childMatch',
    CHILD_DISPATCH_BEFORE: 'childDispatchBefore',
    CHILD_DISPATCH_AFTER: 'childDispatchAfter',
} as const;

export type HookName = typeof HookName[keyof typeof HookName];
