import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        node: 'src/_entries/node.ts',
        bun: 'src/_entries/bun.ts',
        deno: 'src/_entries/deno.ts',
        generic: 'src/_entries/generic.ts',
        compat: 'src/_entries/compat.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
});
