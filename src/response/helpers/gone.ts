import { getProperty, setProperty } from '../../utils';
import type { Response } from '../types';

const symbol = Symbol.for('ResGone');
export function isResponseGone(res: Response) {
    if (res.headersSent || res.writableEnded) {
        return true;
    }

    return getProperty(res, symbol) ?? false;
}

export function setResponseGone(res: Response, value: boolean) {
    setProperty(res, symbol, value);
}
