/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Request } from '../../type';

const ReqMountPathSymbol = Symbol.for('ReqMountPath');

export function useRequestMountPath(req: Request) : string {
    if (ReqMountPathSymbol in req) {
        return (req as any)[ReqMountPathSymbol];
    }

    return '/';
}

export function setRequestMountPath(req: Request, basePath: string) {
    (req as any)[ReqMountPathSymbol] = basePath;
}
