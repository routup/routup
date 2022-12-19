/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { BadRequestError } from '@ebec/http';
import {
    Next, Request, Response, setRequestMountPath, setRequestParams,
} from '@routup/core';
import { processHandlerExecutionOutput } from '../handler';
import { PathMatcher } from '../path';
import {
    DispatcherMeta,
} from '../type';
import { LayerOptions } from './type';

export class Layer {
    readonly '@instanceof' = Symbol.for('Layer');

    protected fn : CallableFunction;

    protected pathMatcher : PathMatcher;

    // --------------------------------------------------

    constructor(
        options: LayerOptions,
        fn: CallableFunction,
    ) {
        this.pathMatcher = new PathMatcher(options.path, options.pathMatcher);
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
        setRequestMountPath(req, meta.mountPath || '/');

        if (typeof err !== 'undefined') {
            if (this.fn.length === 4) {
                try {
                    this.fn(err, req, res, next);
                } catch (e) {
                    /* istanbul ignore next */
                    /* istanbul ignore next */
                    if (e instanceof Error) {
                        next(e);
                    } else {
                        next(new BadRequestError({
                            message: 'The request could not be processed by the error handler.',
                        }));
                    }
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

            processHandlerExecutionOutput(res, next, output);
        } catch (e) {
            /* istanbul ignore next */
            if (e instanceof Error) {
                next(e);
            } else {
                next(new BadRequestError({
                    message: 'The request could not be processed by the handler.',
                }));
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
