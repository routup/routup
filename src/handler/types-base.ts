import type { MethodName } from '../constants';
import type { Path } from '../path';

export type HandlerBase = {
    method?: `${MethodName}` | `${Uppercase<MethodName>}`,
    path?: Path
};
