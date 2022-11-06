/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { InternalServerError } from '@ebec/http';
import {
    ParseOptions, TokensToRegexpOptions,
} from 'path-to-regexp';
import { setRequestParams } from '../helpers';
import { PathMatcher } from '../path';
import {
    DispatcherMeta, Next, Path, Request, Response,
} from '../type';

export class Layer {
    readonly '@instanceof' = Symbol.for('Layer');

    protected fn : CallableFunction;

    protected pathMatcher : PathMatcher;

    // --------------------------------------------------

    constructor(
        path: Path,
        options: TokensToRegexpOptions & ParseOptions,
        fn: CallableFunction,
    ) {
        this.pathMatcher = new PathMatcher(path, options);
        this.fn = fn;
    }

    // --------------------------------------------------

    isError() {
        return this.fn.length === 4;
    }

    // --------------------------------------------------

    dispatch(
        req: Request,
        res: Response,
        meta: DispatcherMeta,
        next: CallableFunction
    ) : void;

    dispatch(
        req: Request,
        res: Response,
        meta: DispatcherMeta,
        next: CallableFunction,
        err: Error,
    ) : void;

    dispatch(
        req: Request,
        res: Response,
        meta: DispatcherMeta,
        next: Next,
        err?: Error,
    ) : void {
        setRequestParams(req, meta.params || {});

        if (typeof err !== 'undefined') {
            if (this.fn.length === 4) {
                try {
                    this.fn(err, req, res, next);
                } catch (e) {
                    /* istanbul ignore next */
                    next(err);
                }

                return;
            }

            /* istanbul ignore next */
            next(err);
            /* istanbul ignore next */
            return;
        }

        /* istanbul ignore next */
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
            /* istanbul ignore next */
            if (e instanceof Error) {
                next(e);
            } else {
                next(new InternalServerError());
            }
        }
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    exec(path: string) {
        return this.pathMatcher.exec(path);
    }
}
