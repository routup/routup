import type { Request } from '../../request';
import type { Response } from '../../response';
import type { DispatcherMeta } from '../meta';

export type DispatcherEvent = {
    // todo: rename to request?
    req: Request,
    // todo: rename to response?
    res: Response,
    // todo: merge with DispatcherEvent
    meta: DispatcherMeta
};
