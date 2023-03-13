/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type {
    OptionsInput,
    SpecV2,
    SpecV3,
    TsCompilerOptions,
    TsConfig,
    Version,
} from '@trapi/swagger';

export type GeneratorOutput<V extends `${Version}`> = V extends `${Version.V2}` ? SpecV2 : SpecV3;
export type GeneratorContext<V extends `${Version}`> = {
    options: OptionsInput,
    tsconfig?: TsConfig | string,
    version: V
};

export {
    SpecV2,
    SpecV3,
    TsCompilerOptions,
    TsConfig,
};
