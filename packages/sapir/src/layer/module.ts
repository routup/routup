/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { InternalServerError } from '@ebec/http';
import {
    Key, ParseOptions, TokensToRegexpOptions, pathToRegexp,
} from 'path-to-regexp';
import { merge } from 'smob';
import { setRequestParams, useRequestParams } from '../helpers';
import { Next, Request, Response } from '../type';

function decodeParam(val: unknown) {
    if (typeof val !== 'string' || val.length === 0) {
        return val;
    }

    return decodeURIComponent(val);
}

export class Layer {
    readonly '@instanceof' = Symbol.for('Layer');

    public path : string | undefined;

    protected pathRaw : string;

    protected params: Record<string, any> | undefined;

    protected fn : CallableFunction;

    protected regexp : RegExp;

    protected regexpOptions : TokensToRegexpOptions & ParseOptions;

    protected keys : Key[] = [];

    // --------------------------------------------------

    constructor(
        path: string,
        options: TokensToRegexpOptions & ParseOptions,
        fn: CallableFunction,
    ) {
        this.pathRaw = path;
        this.fn = fn;
        this.regexpOptions = options;
        this.regexp = pathToRegexp(path, this.keys, options);
    }

    // --------------------------------------------------

    isError() {
        return this.fn.length === 4;
    }

    // --------------------------------------------------

    dispatch(
        req: Request,
        res: Response,
        next: CallableFunction
    ) : void;

    dispatch(
        req: Request,
        res: Response,
        next: CallableFunction,
        err: Error,
    ) : void;

    dispatch(
        req: Request,
        res: Response,
        next: Next,
        err?: Error,
    ) : void {
        setRequestParams(req, merge(this.params || {}, useRequestParams(req) || {}));

        if (typeof err !== 'undefined') {
            if (this.fn.length === 4) {
                try {
                    this.fn(err, req, res, next);
                } catch (e) {
                    next(err);
                }

                return;
            }

            next(err);
            return;
        }

        if (this.fn.length > 3) {
            next();
            return;
        }

        try {
            const output = this.fn(req, res, next);
            if (output instanceof Promise) {
                output.catch((e) => next(e));
            }
        } catch (e) {
            if (e instanceof Error) {
                next(e);
            } else {
                next(new InternalServerError());
            }
        }
    }

    // --------------------------------------------------

    exec(path: string | null) : boolean {
        let match : RegExpExecArray | null = null;

        // set fast path flags
        const fastStar = this.pathRaw === '*';
        const fastSlash = this.pathRaw === '/' && this.regexpOptions.end === false;

        if (path !== null) {
            if (fastSlash) {
                this.params = {};
                this.path = '';

                return true;
            }

            if (fastStar) {
                this.params = { 0: decodeParam(path) };
                this.path = path;
            }

            match = this.regexp.exec(path);
        }

        if (!match) {
            this.params = undefined;
            this.path = undefined;
            return false;
        }

        this.params = {};
        this.path = match[0] as string;

        for (let i = 1; i < match.length; i++) {
            const key = this.keys[i - 1];
            const prop = key.name;
            const val = decodeParam(match[i]);

            if (val !== undefined || !(Object.prototype.hasOwnProperty.call(this.params, prop))) {
                this.params[prop] = val;
            }
        }

        return true;
    }
}
