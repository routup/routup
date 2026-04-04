import type { ServerOptions } from 'srvx';
import { serve as srvxServe } from 'srvx/service-worker';
import type { Router } from '../router/module.ts';

export * from '../index.ts';

export function serve(router: Router, options?: Omit<ServerOptions, 'fetch'>) {
    return srvxServe({ fetch: router.fetch.bind(router), ...options });
}
