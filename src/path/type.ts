import type { ParseOptions, TokensToRegexpOptions } from 'path-to-regexp';

export type PathMatcherOptions = TokensToRegexpOptions & ParseOptions;

export type PathMatcherExecResult = {
    path: string,
    params: Record<string, any>
};
