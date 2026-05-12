export const RouterSymbol = Symbol.for('Router');

export const RouterStackEntryType = {
    ROUTER: 'router',
    HANDLER: 'handler',
} as const;


export type RouterStackEntryType = typeof RouterStackEntryType[keyof typeof RouterStackEntryType];
