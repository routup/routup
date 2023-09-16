import type { Request } from '../request';
import type { Response } from '../response';

export interface Dispatcher {
    dispatch(
        event: DispatcherEvent,
        meta: DispatcherMeta
    ) : Promise<boolean>;
}

export type DispatcherMeta = {
    /**
     * Params collected on path.
     */
    params?: Record<string, any>,

    /**
     * Path to check for the current instance.
     */
    path?: string,

    /**
     * The relative path on which the router is hung.
     */
    mountPath?: string,

    /**
     * The error which occurred during a previous handler.
     */
    error?: Error,

    /**
     * Ids of chained router instances.
     */
    routerIds?: number[]
};

export type DispatcherEvent = {
    req: Request,
    res: Response,
};
