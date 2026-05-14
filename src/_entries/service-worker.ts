import type { ServerOptions } from 'srvx';
import { serve as srvxServe } from 'srvx/service-worker';
import type { IApp } from '../app/types.ts';

export * from '../index.ts';

export function serve(app: IApp, options?: Omit<ServerOptions, 'fetch'>) {
    return srvxServe({ fetch: app.fetch.bind(app), ...options });
}
