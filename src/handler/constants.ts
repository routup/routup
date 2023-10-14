export enum HandlerType {
    CORE = 'core',
    ERROR = 'error',
}

export const HandlerSymbol = Symbol.for('Handler');
