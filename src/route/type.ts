import type { ParseOptions, TokensToRegexpOptions } from 'path-to-regexp';
import type { Path } from '../type';

export type RouteOptions = {
    path: Path,

    pathMatcher: TokensToRegexpOptions & ParseOptions
};
