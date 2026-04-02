import config from '@tada5hi/eslint-config';

export default [
    ...await config(),
    { ignores: ['dist/**'] },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
        },
    },
];
