import type { MethodName } from '../constants';
import type { HandlerVariants } from '../handler';
import type { Path } from '../path';

export type LayerOptions = {
    handler: HandlerVariants,
    method?: `${MethodName}`
    path?: Path,
};
