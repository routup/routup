import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

import { builtinModules } from 'node:module';
import { readFileSync } from 'node:fs';
import { transform } from "@swc/core";

const extensions = [
    '.js', '.mjs', '.cjs', '.ts',
];

const swcOptions = {
    jsc: {
        target: 'es2020',
        parser: {
            syntax: 'typescript',
            decorators: true
        },
        transform: {
            decoratorMetadata: true,
            legacyDecorator: true
        },
        loose: true
    },
    sourceMaps: true
}

function createConfig(
    { pkg, external = [], defaultExport = false }
) {
    external = Object.keys(pkg.dependencies || {})
        .concat(Object.keys(pkg.peerDependencies || {}))
        .concat(builtinModules)
        .concat(external);

    return {
        input: 'src/index.ts',
        external,
        output: [
            {
                format: 'cjs',
                file: pkg.main,
                exports: 'named',
                ...(defaultExport ? { footer: 'module.exports = Object.assign(exports.default, exports);' } : {}),
                sourcemap: true
            },
            {
                format: 'es',
                file: pkg.module,
                exports: 'named',
                sourcemap: true
            }
        ],
        plugins: [
            // Allows node_modules resolution
            resolve({ extensions}),

            // Allow bundling cjs modules. Rollup doesn't understand cjs
            commonjs(),

            // Compile TypeScript/JavaScript files
            {
                name: 'swc',
                transform(code) {
                    return transform(code, swcOptions);
                }
            },
        ]
    };
}

export default createConfig({
    pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
});
