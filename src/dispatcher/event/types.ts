import type { Handler } from '../../handler';
import type { Request } from '../../request';
import type { Response } from '../../response';
import type { Router } from '../../router';
import type { DispatcherMeta } from '../meta';

export type DispatcherRouterMatch = {
    type: 'router',
    data: Router
};

export type DispatcherHandlerMatch = {
    type: 'handler',
    data: Handler
};

export type DispatcherMatch = DispatcherRouterMatch | DispatcherHandlerMatch;

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
