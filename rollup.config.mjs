/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { builtinModules } from 'module';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

/**
 * Create a base rollup config
 * @param {Record<string,any>} pkg Imported package.json
 * @param {boolean} defaultExport Is vue package
 * @returns {import('rollup').Options}
 */
export function createConfig({pkg, vuePlugin: defaultExport = false }) {
    return {
        input: 'src/index.ts',
        external: Object.keys(pkg.dependencies || {})
            .concat(Object.keys(pkg.peerDependencies || {}))
            .concat(builtinModules),
        onwarn: (warning) => {
            throw Object.assign(new Error(), warning);
        },
        strictDeprecations: true,
        output: [
            {
                format: 'cjs',
                file: pkg.main,
                exports: 'named',
                // in all other cases we do not have a default import...
                ...(defaultExport ? {footer: 'module.exports = Object.assign(exports.default, exports);'} : {}),
                sourcemap: true
            },
            {
                format: 'esm',
                file: pkg.module,
                exports: 'named',
                sourcemap: true
            }
        ],
        plugins: [
            // Allows node_modules resolution
            resolve({
                extensions,
            }),

            replace({
                'process.env.NODE_ENV': JSON.stringify('production'),
                preventAssignment: true,
            }),

            // Allow bundling cjs modules. Rollup doesn't understand cjs
            commonjs(),

            esbuild({
                tsconfig: 'tsconfig.build.json',
                minify: true,
            })
        ],
    };
}
