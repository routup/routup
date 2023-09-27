import type { MethodName } from '../constants';
import type { Path } from '../path';

export type HandlerConfigBase = {
    method?: `${MethodName}` | `${Uppercase<MethodName>}`,
    path?: Path
};
