/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Request } from '../../type';

const envSymbol = Symbol.for('ReqEnv');

export function setRequestEnv(req: Request, key: string, value: unknown) : void {
    if (envSymbol in req) {
        (req as any)[envSymbol][key] = value;
    }

    (req as any)[envSymbol] = {
        [key]: value,
    };
}

export function useRequestEnv(req: Request, key: string) : unknown | undefined {
    if (envSymbol in req) {
        return (req as any)[envSymbol][key];
    }

    return undefined;
}
