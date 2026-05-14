import type { Server, ServerOptions } from 'srvx';
import { serve as srvxServe } from 'srvx/generic';
import type { IApp } from '../app';

export * from '../index.ts';

export function serve(app: IApp, options?: Omit<ServerOptions, 'fetch'>): Server {
    return srvxServe({ fetch: app.fetch.bind(app), ...options });
}
