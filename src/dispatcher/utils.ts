import type { DispatcherMeta } from './type';

export function cloneDispatcherMeta(input?: DispatcherMeta): DispatcherMeta {
    if (!input) {
        return {};
    }

    return {
        path: input.path,
        mountPath: input.mountPath,
        error: input.error,
        routerIds: [...input.routerIds || []],
        params: cloneDispatcherMetaParams(input.params),
    };
}

export function cloneDispatcherMetaParams(input?: Record<string, any>) {
    if (typeof input === 'undefined') {
        return {};
    }

    const keys = Object.keys(input);
    const output : Record<string, any> = {};
    for (let i = 0; i < keys.length; i++) {
        output[keys[i]] = input[keys[i]];
    }

    return output;
}

export function mergeDispatcherMetaParams(
    t1?: Record<string, any>,
    t2?: Record<string, any>,
) : Record<string, any> {
    if (!t1 && !t2) {
        return {};
    }

    if (!t1 || !t2) {
        return (t1 || t2) as Record<string, any>;
    }

    const keys = Object.keys(t2);
    for (let i = 0; i < keys.length; i++) {
        t1[keys[i]] = t2[keys[i]];
    }

    return t1;
}
