import type {
    NodeHttp1Handler,
    NodeHttp2Handler,
    Server,
    ServerOptions,
} from 'srvx';
import { serve as srvxServe, toNodeHandler as srvxToNodeHandler } from 'srvx/node';
import type { AdapterMeta } from 'srvx/node';
import type { IApp } from '../app/types.ts';

export * from '../index.ts';

export function serve(app: IApp, options?: Omit<ServerOptions, 'fetch'>): Server {
    return srvxServe({ fetch: app.fetch.bind(app), ...options });
}

// srvx types its result as a union, but the same function handles both protocols.
export function toNodeHandler(app: IApp): NodeHttp1Handler & NodeHttp2Handler & AdapterMeta {
    return srvxToNodeHandler(app.fetch.bind(app)) as NodeHttp1Handler & NodeHttp2Handler & AdapterMeta;
}
