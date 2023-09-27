import type {
    CoreHandler,
    CoreHandlerConfig,
} from './core';
import type {
    ErrorHandler,
    ErrorHandlerConfig,
} from './error';

export type Next = (err?: Error) => void;

export type HandlerConfig = CoreHandlerConfig |
ErrorHandlerConfig;

export type Handler = CoreHandler |
ErrorHandler;
