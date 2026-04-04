import type { Server, ServerOptions } from 'srvx';
import { serve as srvxServe } from 'srvx/deno';
import type { Router } from '../router/module.ts';

export * from '../index.ts';

export function serve(router: Router, options?: Omit<ServerOptions, 'fetch'>): Server {
    return srvxServe({ fetch: router.fetch.bind(router), ...options });
}
