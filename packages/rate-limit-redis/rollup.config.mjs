/*
 * Copyright (c) 2022-2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { readFileSync } from 'fs';

import { createConfig } from '../../rollup.config.mjs';

export default {
    ...createConfig({
        pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')),
        defaultExport: true
    }),
    input: 'src/index.ts'
};
