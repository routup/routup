/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Version, generate as _generate, isMetadata } from '@trapi/swagger';
import path from 'node:path';
import process from 'node:process';
import { createMerger } from 'smob';
import type { GeneratorContext, GeneratorOutput } from './type';

export async function generate<V extends `${Version}`>(
    context: GeneratorContext<V>,
): Promise<GeneratorOutput<V>> {
    if (context.options.metadata) {
        if (!isMetadata(context.options.metadata)) {
            if (!context.options.metadata.entryPoint) {
                context.options.metadata.entryPoint = [
                    { pattern: '**/*.ts', cwd: path.join(process.cwd(), 'src') },
                ];
            }

            if (!context.options.metadata.preset) {
                context.options.metadata.preset = '@routup/swagger-preset';
            }
        }
    } else {
        context.options.metadata = {
            ignore: ['**/node_modules/**'],
            preset: '@routup/swagger-preset',
            entryPoint: [
                { pattern: '**/*.ts', cwd: path.join(process.cwd(), 'src') },
            ],
        };
    }

    const merge = createMerger({
        array: true,
        arrayDistinct: true,
    });

    context.options = merge({
        name: 'API Documentation',
        description: 'Explore the REST Endpoints of the API.',
        consumes: ['application/json'],
        produces: ['application/json'],
    }, context.options || {});

    return await _generate({
        version: context.version || Version.V3,
        options: context.options,
        tsConfig: context.tsconfig,
    }) as GeneratorOutput<V>;
}
