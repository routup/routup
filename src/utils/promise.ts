import { isObject } from './object.ts';

export function isPromise(p: unknown) : p is Promise<unknown> {
    return isObject(p) &&
        (
            p instanceof Promise ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            typeof p.then === 'function'
        );
}
