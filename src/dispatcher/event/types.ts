import type { MethodName } from '../../constants';
import type { Request } from '../../request';
import type { Response } from '../../response';

export type DispatcherEventCreateContext = {
    request: Request,
    response: Response,
    method?: `${MethodName}`,
    path?: string
};
