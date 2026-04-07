import type { CoreHandlerOptions } from './core/index.ts';
import type { ErrorHandlerOptions } from './error/index.ts';

export type HandlerOptions = CoreHandlerOptions | ErrorHandlerOptions;

