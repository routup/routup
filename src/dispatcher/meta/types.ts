import type { ErrorProxy } from '../../error';

export type DispatcherMeta = {
    /**
     * Params collected on path.
     */
    params: Record<string, any>,

    /**
     * Path to check for the current instance.
     */
    path: string,

    /**
     * The relative path on which the router is hung.
     */
    mountPath: string,

    /**
     * The error which occurred during a previous handler.
     */
    error?: ErrorProxy,

    /**
     * Ids of chained router instances.
     */
    routerPath: number[]
};
