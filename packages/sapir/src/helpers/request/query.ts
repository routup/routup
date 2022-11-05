/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */
import { IncomingMessage } from 'http';
import qs from 'qs';

const QuerySymbol = Symbol.for('ReqQuery');

export function useRequestQuery(req: IncomingMessage) : Record<string, any> {
    if ('query' in req) {
        return (req as any).query;
    }

    if (QuerySymbol in req) {
        return (req as any)[QuerySymbol];
    }

    const url = new URL(req.url, 'http://localhost/');

    let { search } = url;
    if (search.substring(0, 1) === '?') {
        search = search.substring(1);
    }

    const data = qs.parse(search);
    (req as any)[QuerySymbol] = data;
    return data;
}
