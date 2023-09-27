import type { MethodName } from '../constants';
import type { Handler } from '../handler';
import type { Path } from '../path';

export type LayerOptions = {
    handler: Handler,
    method?: `${MethodName}`
    path?: Path,
};
