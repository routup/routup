import { hasOwnProperty } from 'smob';
import { buildEtagFn } from '../utils';
import { transformRouterOptions } from './transform';
import type { RouterOptions, RouterOptionsInput } from './type';

const defaults : RouterOptions = {
    trustProxy: () => false,
    subdomainOffset: 2,
    etag: buildEtagFn(),
    proxyIpMax: 0,
};

const instances : Record<number, Partial<RouterOptions>> = {};

export function setRouterOptions(id: number, input: RouterOptionsInput) {
    instances[id] = transformRouterOptions(input);
}

export function unsetRouterOptions(id: number) {
    delete instances[id];
}

export function findRouterOption<
K extends keyof RouterOptions,
>(key: K, id?: number | number[]) : RouterOptions[K] {
    if (!id) {
        return defaults[key];
    }

    const ids = Array.isArray(id) ? id : [id];
    if (ids.length > 0) {
        for (let i = ids.length; i >= 0; i--) {
            if (
                hasOwnProperty(instances, ids[i]) &&
                typeof instances[ids[i]][key] !== 'undefined'
            ) {
                return instances[ids[i]][key] as RouterOptions[K];
            }
        }
    }

    return defaults[key];
}
