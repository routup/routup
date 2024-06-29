import type { ParseOptions, PathToRegexpOptions } from 'path-to-regexp';

export type PathMatcherOptions = PathToRegexpOptions & ParseOptions;

export type PathMatcherExecResult = {
    path: string,
    params: Record<string, any>
};

export type Path = string;
