/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Request, Response } from '../type';

export type RequestFn = (req: Request) => any;

export type ResponseFn = (res: Response) => any;
