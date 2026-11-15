import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        // Docs modules import `routup` by name; run them against the source,
        // not `dist/`, which CI's test job does not build.
        alias: [{ find: /^routup$/, replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)) }],
    },
    test: {
        include: ['test/unit/**/*.{test,spec}.{js,ts}'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx,js,jsx}'],
            thresholds: {
                branches: 58,
                functions: 77,
                lines: 73,
                statements: 73,
            },
        },
    },
});
