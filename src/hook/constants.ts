export const HookName = {
    REQUEST: 'request',
    RESPONSE: 'response',
    ERROR: 'error',

    CHILD_MATCH: 'childMatch',
    CHILD_DISPATCH_BEFORE: 'childDispatchBefore',
    CHILD_DISPATCH_AFTER: 'childDispatchAfter',
} as const;

export type HookName = typeof HookName[keyof typeof HookName];
