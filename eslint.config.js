import config from '@tada5hi/eslint-config';

export default [
    ...await config(),
    { ignores: ['dist/**', 'docs/src/.vitepress/cache/**', 'docs/src/.vitepress/dist/**'] },
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            // Exported types are colocated with their module on purpose.
            '@tada5hi/type-declaration-location': 'off',
            // Newer than the published ES2022 / Node.js 22 runtime baseline.
            'unicorn/prefer-promise-with-resolvers': 'off',
            'unicorn/prefer-uint8array-base64': 'off',
        },
    },
    {
        // Each runtime entry re-exports the core API by design.
        files: ['src/_entries/*.ts'],
        rules: { '@tada5hi/no-reexport-shims': 'off' },
    },
    {
        // `WebHandler*` are public API; the docs components are not library code.
        files: ['src/handler/adapters/web/types.ts', 'docs/src/.vitepress/theme/**/*.vue'],
        rules: { '@typescript-eslint/naming-convention': 'off' },
    },
];
