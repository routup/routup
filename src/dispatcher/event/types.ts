import type { Request } from '../../request';
import type { Response } from '../../response';
import type { DispatcherMeta } from '../meta';

export type DispatcherEvent = {
    req: Request,
    res: Response,
    meta: DispatcherMeta
};
