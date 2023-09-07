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
    path: Path;

    regexp : RegExp;

    regexpKeys : Key[] = [];

    regexpOptions: PathMatcherOptions;

    constructor(path: Path, options?: PathMatcherOptions) {
        this.path = path;
        this.regexpOptions = options || {};

        if (path instanceof RegExp) {
            this.regexp = path;
        } else {
            this.regexp = pathToRegexp(path, this.regexpKeys, options);
        }
    }

    test(path: string) {
        const fastSlash = this.path === '/' && this.regexpOptions.end === false;
        if (fastSlash) {
            return true;
        }

        return this.regexp.test(path);
    }

    exec(path: string) : PathMatcherExecResult | undefined {
        let match : RegExpExecArray | null = null;

        const fastSlash = this.path === '/' && this.regexpOptions.end === false;
        if (fastSlash) {
            return {
                path: '/',
                params: {},
            };
        }

        match = this.regexp.exec(path);

        if (!match) {
            return undefined;
        }

        if (this.path instanceof RegExp) {
            return {
                path,
                params: {
                    0: decodeParam(match[0]),
                },
            };
        }

        const output : Record<string, unknown> = {};

        for (let i = 1; i < match.length; i++) {
            const key = this.regexpKeys[i - 1];
            const prop = key.name;
            const val = decodeParam(match[i]);

            if (typeof val !== 'undefined') {
                output[prop] = val;
            }
        }

        return {
            path: match[0],
            params: output,
        };
    }
}
