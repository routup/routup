import type { IRoutupEvent } from '../event/types.ts';
import type { RouterOptions } from '../router/types.ts';
import { buildEtagFn } from '../utils/index.ts';

export const routerDefaults: RouterOptions = {
    trustProxy: () => false,
    subdomainOffset: 2,
    etag: buildEtagFn(),
    proxyIpMax: 0,
};

export function getRouterOption<
    K extends keyof RouterOptions,
>(event: IRoutupEvent, key: K): RouterOptions[K] {
    for (let i = event.routerPath.length - 1; i >= 0; i--) {
        const value = event.routerPath[i]!.config[key];
        if (typeof value !== 'undefined') {
            return value as RouterOptions[K];
        }
    }

    return routerDefaults[key];
}
