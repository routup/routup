import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { AppError } from '../../../src/error/index.ts';
import { Deadline, createTimeoutError } from '../../../src/utils/index.ts';

describe('src/utils/deadline', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create a 408 timeout error', () => {
        const error = createTimeoutError();

        expect(error).toBeInstanceOf(AppError);
        expect(error.status).toBe(408);
        expect(error.message).toBe('Request Timeout');
    });

    it('should resolve with the value of the work before the deadline', async () => {
        const deadline = new Deadline(100);

        const promise = deadline.run(() => new Promise((resolve) => {
            setTimeout(() => resolve('ok'), 50);
        }));

        await vi.advanceTimersByTimeAsync(50);

        await expect(promise).resolves.toBe('ok');
        expect(deadline.signal.aborted).toBe(false);
    });

    it('should resolve with a sync value', async () => {
        const deadline = new Deadline(100);

        await expect(deadline.run(() => 'sync')).resolves.toBe('sync');
    });

    it('should reject with a 408 error at the deadline and abort the signal', async () => {
        const deadline = new Deadline(100);

        const promise = deadline.run(() => new Promise(() => {}));
        const assertion = expect(promise).rejects.toMatchObject({
            status: 408,
            message: 'Request Timeout',
        });

        await vi.advanceTimersByTimeAsync(99);
        expect(deadline.signal.aborted).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await assertion;

        await expect(promise).rejects.toBeInstanceOf(AppError);
        expect(deadline.signal.aborted).toBe(true);
    });

    it('should propagate a parent abort with its reason', () => {
        const parent = new AbortController();
        const deadline = new Deadline(100, parent.signal);

        expect(deadline.signal.aborted).toBe(false);

        const reason = new Error('client gone');

        parent.abort(reason);

        expect(deadline.signal.aborted).toBe(true);
        expect(deadline.signal.reason).toBe(reason);
    });

    it('should start aborted when the parent is already aborted', () => {
        const parent = new AbortController();
        const reason = new Error('already gone');

        parent.abort(reason);

        const deadline = new Deadline(100, parent.signal);

        expect(deadline.signal.aborted).toBe(true);
        expect(deadline.signal.reason).toBe(reason);
    });

    it('should clear the timer but keep the parent linked after the work resolves', async () => {
        const parent = new AbortController();
        const removeSpy = vi.spyOn(parent.signal, 'removeEventListener');
        const deadline = new Deadline(100, parent.signal);

        const promise = deadline.run(() => Promise.resolve('ok'));

        expect(vi.getTimerCount()).toBe(1);

        await promise;

        expect(vi.getTimerCount()).toBe(0);
        expect(removeSpy).not.toHaveBeenCalled();

        const reason = new Error('late');

        parent.abort(reason);

        expect(deadline.signal.aborted).toBe(true);
        expect(deadline.signal.reason).toBe(reason);
    });

    it('should clear the timer but keep the parent linked after the work rejects', async () => {
        const parent = new AbortController();
        const removeSpy = vi.spyOn(parent.signal, 'removeEventListener');
        const deadline = new Deadline(100, parent.signal);

        const promise = deadline.run(() => Promise.reject(new Error('boom')));

        await expect(promise).rejects.toThrow('boom');

        expect(vi.getTimerCount()).toBe(0);
        expect(removeSpy).not.toHaveBeenCalled();
    });

    it('should unlink the parent on release after the work settled', async () => {
        const parent = new AbortController();
        const removeSpy = vi.spyOn(parent.signal, 'removeEventListener');
        const deadline = new Deadline(100, parent.signal);

        await deadline.run(() => 'ok');
        deadline.release();

        expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
        expect(vi.getTimerCount()).toBe(0);

        parent.abort(new Error('late'));
        expect(deadline.signal.aborted).toBe(false);
    });

    it('should clear the timer after the deadline fires', async () => {
        const deadline = new Deadline(100);

        const promise = deadline.run(() => new Promise(() => {}));
        const assertion = expect(promise).rejects.toMatchObject({ status: 408 });

        await vi.advanceTimersByTimeAsync(100);
        await assertion;

        expect(vi.getTimerCount()).toBe(0);
    });

    it('should pass a rejection from the work through unchanged', async () => {
        const deadline = new Deadline(100);
        const error = new Error('boom');

        await expect(deadline.run(() => Promise.reject(error))).rejects.toBe(error);
    });

    it('should pass a sync throw from the work through unchanged', async () => {
        const deadline = new Deadline(100);
        const error = new Error('boom');

        await expect(deadline.run(() => {
            throw error;
        })).rejects.toBe(error);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('should remove the parent listener on release without running work', () => {
        const parent = new AbortController();
        const removeSpy = vi.spyOn(parent.signal, 'removeEventListener');
        const deadline = new Deadline(100, parent.signal);

        deadline.release();

        expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));

        parent.abort();
        expect(deadline.signal.aborted).toBe(false);
    });
});
