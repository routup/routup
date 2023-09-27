import type {
    CoreHandler,
    CoreHandlerFn,
} from './core';
import type {
    ErrorHandler,
    ErrorHandlerFn,
} from './error';

export type Next = (err?: Error) => void;

export type Handler = CoreHandler |
ErrorHandler;

export type HandlerFn = CoreHandlerFn |
ErrorHandlerFn;
