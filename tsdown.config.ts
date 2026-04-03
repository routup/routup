import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        node: 'src/_entries/node.ts',
        bun: 'src/_entries/bun.ts',
        deno: 'src/_entries/deno.ts',
        generic: 'src/_entries/generic.ts',
        cloudflare: 'src/_entries/cloudflare.ts',
        'service-worker': 'src/_entries/service-worker.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
});
