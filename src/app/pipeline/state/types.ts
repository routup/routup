import type { MethodNameLike } from '../../../constants.ts';
import type { AppError } from '../../../error/module.ts';
import type { AppEventRoute, AppRequest, AppResponse } from '../../../event/types.ts';
import type { Handler } from '../../../handler/module.ts';
import type { Route } from '../../../types.ts';
import type { AppOptions } from '../../types.ts';

/**
 * Request-scoped state of one `App.fetch()` call: what the match walk
 * and the handlers share while a request moves through the pipeline.
 */
export interface IPipelineState {
    readonly request: AppRequest;

    readonly method: MethodNameLike;

    /**
     * Request path. Fixed for the whole request: the match list is
     * looked up from it once.
     */
    readonly path: string;

    /**
     * Raw query string (`?a=1`, or empty); each handler event parses
     * it on its first `searchParams` read.
     */
    readonly search: string;

    readonly appOptions: Readonly<AppOptions>;

    /**
     * Route parameters accumulated over the matches walked so far.
     */
    params: Record<string, string | undefined>;

    /**
     * Prefix the running handler's route matched on. The walk sets it
     * per match and restores it when the handler returns.
     */
    mountPath: string;

    /**
     * Pending error. While set, the walk runs ERROR handlers only.
     */
    error?: AppError;

    /**
     * The last method-bound route the walk dispatched. Set by the walk
     * and never reset during the request.
     */
    dispatchedRoute?: Route<Handler>;

    /**
     * `event.route`: the value of `dispatchedRoute`, built on the
     * first read and kept until a later route is dispatched, or
     * `undefined`.
     */
    readonly route: AppEventRoute | undefined;

    /**
     * Whether a handler produced a response. Stops every walk of this
     * request.
     */
    dispatched: boolean;

    /**
     * Methods of the routes matching the path, for the synthesized
     * `Allow` response. Collected for `OPTIONS` requests only.
     */
    readonly methodsAllowed: Set<string> | undefined;

    readonly response: AppResponse;

    readonly store: Record<string | symbol, unknown>;

    /**
     * Signal handlers inherit: the request's own, unless a
     * request-wide deadline replaced it.
     */
    signal: AbortSignal;
}
