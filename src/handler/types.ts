import type { CoreHandlerConfig, CoreHandlerFn } from './core';
import type { ErrorHandlerConfig, ErrorHandlerFn } from './error';

export type Next = (err?: Error) => void;

export type HandlerConfig = CoreHandlerConfig | ErrorHandlerConfig;

export type HandlerFn = CoreHandlerFn |
ErrorHandlerFn;
