/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ReadDirectoryCallback } from '../type';

export function readDirectory(
    dir: string,
    callback: ReadDirectoryCallback,
    prefix = '',
) {
    dir = path.resolve('.', dir);

    let abs : string;
    let stats : fs.Stats;

    fs.promises.readdir(dir).then((arr) => {
        for (let i = 0; i < arr.length; i++) {
            abs = path.join(dir, arr[i]);
            stats = fs.statSync(abs);

            if (stats.isDirectory()) {
                readDirectory(abs, callback, path.join(prefix, arr[i]));
            } else {
                callback(path.join(prefix, arr[i]), abs, stats);
            }
        }
    });
}
