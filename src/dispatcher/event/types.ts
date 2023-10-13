import type { Handler } from '../../handler';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Router } from '../../router';
import type { DispatcherMeta } from '../meta';

// todo: change to { type: 'router' | 'handler', data: {} }
export type DispatcherMatch = Router | Handler;

export type DispatcherEvent = {
    // todo: rename to request?
    req: Request,

    // todo: rename to response?
    res: Response,

    // todo: set router as match on initial dispatch process -> non optional
    match?: DispatcherMatch,

    // todo: merge with DispatcherEvent
    meta: DispatcherMeta
};
