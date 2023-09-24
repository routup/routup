import type { DispatcherMeta } from './type';

export function buildDispatcherMeta(
    input: Partial<DispatcherMeta>,
): DispatcherMeta {
    return {
        mountPath: input.mountPath || '/',
        params: input.params || {},
        path: input.path || '/',
        routerPath: [],
    };
}
export function cloneDispatcherMeta(input: DispatcherMeta): DispatcherMeta {
    return {
        path: input.path,
        mountPath: input.mountPath,
        error: input.error,
        routerPath: [...input.routerPath],
        params: cloneDispatcherMetaParams(input.params),
    };
}

export function cloneDispatcherMetaParams(input?: Record<string, any>) {
    if (typeof input === 'undefined') {
        return {};
    }

    const keys = Object.keys(input);
    if (keys.length === 0) {
        return {};
    }

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
    if (keys.length === 0) {
        return t1;
    }

    for (let i = 0; i < keys.length; i++) {
        t1[keys[i]] = t2[keys[i]];
    }

    return t1;
}
