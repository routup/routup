import type { AppEvent } from '../../event/module.ts';
import type { IPipelineState } from './state/index.ts';

/**
 * One handler invocation of the walk, as `Handler.dispatch` and the
 * walk see it. It says nothing about how the handler's event is
 * built.
 */
export interface IPipelineStep {
    readonly state: IPipelineState;

    /**
     * The event handed to the handler, once `createEvent()` built it.
     * The walk reads `event.nextCalled` to learn whether the handler
     * consumed its continuation.
     */
    readonly event?: AppEvent;

    /**
     * Set by `Handler.dispatch` when the handler settled with a
     * failure (a throw, or its deadline). The walk has moved on from
     * this step by then, so its continuation is inert.
     */
    failed: boolean;

    /**
     * Build the handler's event.
     *
     * @param signal - Handler-scoped signal (per-handler deadline).
     *                 Defaults to the signal of the request.
     */
    createEvent(signal?: AbortSignal): AppEvent;
}
