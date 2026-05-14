import type { Server, ServerOptions } from 'srvx';
import { serve as srvxServe, toNodeHandler as srvxToNodeHandler } from 'srvx/node';
import type { IApp } from '../app/types.ts';

export * from '../index.ts';

export function serve(app: IApp, options?: Omit<ServerOptions, 'fetch'>): Server {
    return srvxServe({ fetch: app.fetch.bind(app), ...options });
}

export function toNodeHandler(app: IApp) {
    return srvxToNodeHandler(app.fetch.bind(app));
}
