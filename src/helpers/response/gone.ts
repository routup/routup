import type { NodeResponse } from '../../bridge';

const GoneSymbol = Symbol.for('ResGone');
export function isResponseGone(res: NodeResponse) {
    if (res.headersSent || res.writableEnded) {
        return true;
    }

    if (GoneSymbol in res) {
        return (res as any)[GoneSymbol];
    }

    return false;
}
