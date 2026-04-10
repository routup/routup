export const HandlerType = {
    CORE: 'core',
    ERROR: 'error',
} as const;

export type HandlerType = typeof HandlerType[keyof typeof HandlerType];

export const HandlerSymbol = Symbol.for('Handler');
