import type { Key } from 'path-to-regexp';
import { pathToRegexp } from 'path-to-regexp';
import type { Path, PathMatcherExecResult, PathMatcherOptions } from './type';

function decodeParam(val: unknown) {
    /* istanbul ignore next */
    if (typeof val !== 'string' || val.length === 0) {
        return val;
    }

    return decodeURIComponent(val);
}

export class PathMatcher {
    protected path: Path;

    protected regexp : RegExp;

    protected regexpKeys : Key[] = [];

    protected regexpOptions: PathMatcherOptions;

    constructor(path: Path, options?: PathMatcherOptions) {
        this.path = path;

        this.regexpOptions = options || {};
        this.regexp = pathToRegexp(path, this.regexpKeys, options);
    }

    test(path: string) {
        return this.regexp.test(path);
    }

    exec(path: string) : PathMatcherExecResult | undefined {
        if (
            this.path === '/' &&
            this.regexpOptions.end === false
        ) {
            return {
                path: '/',
                params: {},
            };
        }

        if (this.path === '*') {
            return {
                path,
                params: {
                    0: decodeParam(path),
                },
            };
        }

        const match = this.regexp.exec(path);

        if (!match) {
            return undefined;
        }

        const params : Record<string, unknown> = {};

        for (let i = 1; i < match.length; i++) {
            const key = this.regexpKeys[i - 1];
            const prop = key.name;
            const val = decodeParam(match[i]);

            if (typeof val !== 'undefined') {
                params[prop] = val;
            }
        }

        return {
            path: match[0],
            params,
        };
    }
}
