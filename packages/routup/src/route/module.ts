/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { hasOwnProperty, merge } from 'smob';
import {
    Handler, Method, Next, Request, Response,
} from '@routup/core';
import { Layer } from '../layer';
import { PathMatcher, PathMatcherOptions } from '../path';
import {
    DispatcherMeta,
    Path,
} from '../type';
import { RouteOptions } from './type';

export class Route {
    readonly '@instanceof' = Symbol.for('Route');

    public path : Path;

    protected pathMatcher : PathMatcher;

    protected pathMatcherOptions : PathMatcherOptions;

    protected layers : Record<string, Layer[]> = {};

    // --------------------------------------------------

    constructor(options: RouteOptions) {
        this.path = options.path;

        this.pathMatcherOptions = {
            end: true,
            strict: this.isStrictPath(),
            ...options.pathMatcher,
        };
        this.pathMatcher = new PathMatcher(this.path, this.pathMatcherOptions);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    matchMethod(method: string) : boolean {
        let name = method.toLowerCase();

        if (
            name === Method.HEAD &&
            !hasOwnProperty(this.layers, name)
        ) {
            name = Method.GET;
        }

        return Object.prototype.hasOwnProperty.call(this.layers, name);
    }

    // --------------------------------------------------

    getMethods() : string[] {
        const keys = Object.keys(this.layers);

        if (
            hasOwnProperty(this.layers, Method.GET) &&
            !hasOwnProperty(this.layers, Method.HEAD)
        ) {
            keys.push(Method.HEAD);
        }

        return keys;
    }

    // --------------------------------------------------

    dispatch(
        req: Request,
        res: Response,
        meta: DispatcherMeta,
        done: Next,
    ) : void {
        /* istanbul ignore next */
        if (!req.method) {
            done();
            return;
        }

        let name = req.method.toLowerCase();

        if (
            name === Method.HEAD &&
            !hasOwnProperty(this.layers, name)
        ) {
            name = Method.GET;
        }

        const layers = this.layers[name];

        /* istanbul ignore next */
        if (
            typeof layers === 'undefined' ||
            layers.length === 0 ||
            typeof meta.path === 'undefined'
        ) {
            done();

            return;
        }

        const layerMeta : DispatcherMeta = {
            ...meta,
        };

        const output = this.pathMatcher.exec(meta.path);
        if (output) {
            layerMeta.params = merge({}, (meta.params || {}), output.params);
        }

        let index = -1;

        const next = (err?: Error) : void => {
            index++;

            if (index >= layers.length) {
                setImmediate(done, err);
                return;
            }

            const layer = layers[index];
            if (
                err &&
                !layer.isError()
            ) {
                next(err);
                return;
            }

            layer.dispatch(req, res, { ...layerMeta }, next);
        };

        next();
    }

    // --------------------------------------------------

    register(method: `${Method}`, ...handlers: Handler[]) {
        this.layers[method] = [];

        for (let i = 0; i < handlers.length; i++) {
            const layer = new Layer(
                {
                    path: this.path,
                    pathMatcher: this.pathMatcherOptions,
                },
                handlers[i],
            );

            this.layers[method].push(layer);
        }
    }

    get(...handlers: Handler[]) {
        return this.register(Method.GET, ...handlers);
    }

    post(...handlers: Handler[]) {
        return this.register(Method.POST, ...handlers);
    }

    put(...handlers: Handler[]) {
        return this.register(Method.PUT, ...handlers);
    }

    patch(...handlers: Handler[]) {
        return this.register(Method.PATCH, ...handlers);
    }

    delete(...handlers: Handler[]) {
        return this.register(Method.DELETE, ...handlers);
    }

    head(...handlers: Handler[]) {
        return this.register(Method.HEAD, ...handlers);
    }

    options(...handlers: Handler[]) {
        return this.register(Method.OPTIONS, ...handlers);
    }

    // --------------------------------------------------

    private isStrictPath() {
        return typeof this.path !== 'string' ||
            (this.path !== '/' && this.path.length !== 0);
    }
}
