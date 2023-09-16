import type { Response } from '../types';

const GoneSymbol = Symbol.for('ResGone');
export function isResponseGone(res: Response) {
    if (res.headersSent || res.writableEnded) {
        return true;
    }

    if (GoneSymbol in res) {
        return (res as any)[GoneSymbol];
    }

    return false;
}
