import { hasOwnProperty } from 'smob';
import { buildEtagFn } from '../utils';
import type { RouterOptions } from './type';

const defaults : RouterOptions = {
    trustProxy: () => false,
    subdomainOffset: 2,
    etag: buildEtagFn(),
    proxyIpMax: 0,
};

const instances : Record<number, Partial<RouterOptions>> = {};

export function setRouterOptions(id: number, input: Partial<RouterOptions>) {
    instances[id] = input;
}

export function unsetRouterOptions(id: number) {
    delete instances[id];
}

export function findRouterOption<
    K extends keyof RouterOptions,
>(key: K, path?: number[]) : RouterOptions[K] {
    if (!path || path.length === 0) {
        return defaults[key];
    }

    if (path.length > 0) {
        for (let i = path.length; i >= 0; i--) {
            const segment = path[i];
            if (
                segment !== undefined &&
                hasOwnProperty(instances, segment) &&
                typeof instances[segment]![key] !== 'undefined'
            ) {
                return instances[segment]![key] as RouterOptions[K];
            }
        }
    }

    return defaults[key];
}
