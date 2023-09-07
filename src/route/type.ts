import type { ParseOptions, TokensToRegexpOptions } from 'path-to-regexp';
import type { Path } from '../path';

export type RouteOptions = {
    path: Path,

    pathMatcher: TokensToRegexpOptions & ParseOptions
};
