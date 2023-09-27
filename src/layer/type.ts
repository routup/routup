import type { MethodName } from '../constants';
import type { HandlerFn } from '../handler';
import type { Path } from '../path';

export type LayerOptions = {
    handler: HandlerFn,
    method?: `${MethodName}`
    path?: Path,
};
