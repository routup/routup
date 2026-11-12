import { createError } from '../error/create.ts';
import type { AppError } from '../error/module.ts';

/**
 * Create the error a request or handler fails with when its deadline fires.
 */
export function createTimeoutError(): AppError {
    return createError({ status: 408, message: 'Request Timeout' });
}

/**
 * Run work under a deadline of `ms` milliseconds.
 *
 * `signal` aborts when the deadline fires, or when `parent` aborts
 * (with the parent's reason). An already-aborted parent yields an
 * already-aborted signal. The signal exists from construction, so a
 * caller can hand it out before the timed work starts; the timer only
 * starts in `run()`.
 */
export class Deadline {
    readonly signal: AbortSignal;

    protected ms: number;

    protected controller: AbortController;

    protected timerId: ReturnType<typeof setTimeout> | undefined;

    protected releaseParent: (() => void) | undefined;

    constructor(ms: number, parent?: AbortSignal) {
        this.ms = ms;
        this.controller = new AbortController();
        this.signal = this.controller.signal;

        if (!parent) {
            return;
        }

        if (parent.aborted) {
            this.controller.abort(parent.reason);

            return;
        }

        const onAbort = () => this.controller.abort(parent.reason);

        parent.addEventListener('abort', onAbort, { once: true });
        this.releaseParent = () => parent.removeEventListener('abort', onAbort);
    }

    /**
     * Race `work` against the deadline. On expiry the signal aborts and
     * the returned promise rejects with the 408 error; a rejection from
     * `work` passes through unchanged. Once settled, the timer is
     * cleared and the parent listener removed.
     */
    async run<T>(work: () => T | Promise<T>): Promise<T> {
        try {
            return await Promise.race([
                work(),
                new Promise<never>((_, reject) => {
                    this.timerId = setTimeout(() => {
                        this.controller.abort();
                        reject(createTimeoutError());
                    }, this.ms);
                }),
            ]);
        } finally {
            this.release();
        }
    }

    /**
     * Clear the timer and remove the parent listener. Idempotent; covers
     * callers that fail before reaching `run()`.
     */
    release(): void {
        clearTimeout(this.timerId);
        this.timerId = undefined;

        if (!this.releaseParent) {
            return;
        }

        this.releaseParent();
        this.releaseParent = undefined;
    }
}
