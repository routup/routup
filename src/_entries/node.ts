import type { Server, ServerOptions } from 'srvx';
import { serve as srvxServe, toNodeHandler as srvxToNodeHandler } from 'srvx/node';
import type { Router } from '../router/module.ts';

export * from '../index.ts';

export function serve(router: Router, options?: Omit<ServerOptions, 'fetch'>): Server {
    return srvxServe({ fetch: router.fetch.bind(router), ...options });
}

export function toNodeHandler(router: Router) {
    return srvxToNodeHandler(router.fetch.bind(router));
}
