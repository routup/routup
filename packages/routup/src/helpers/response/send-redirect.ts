/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Response } from '../../type';
import { send } from './send';

export function sendRedirect(res: Response, location: string, statusCode = 302) {
    res.statusCode = statusCode;
    res.setHeader('location', location);

    const encodedLoc = location.replace(/"/g, '%22');
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;

    return send(res, html);
}
