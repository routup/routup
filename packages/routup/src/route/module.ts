/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { merge } from 'smob';
import { Method } from '../constants';
import { Handler } from '../handler';
import { Layer } from '../layer';
import { PathMatcher, PathMatcherOptions } from '../path';
import {
    DispatcherMeta,
    Next, Path, Request, Response,
} from '../type';

export class Route {
    readonly '@instanceof' = Symbol.for('Route');

    public path : Path;

    protected pathMatcher : PathMatcher;

    protected pathMatcherOptions : PathMatcherOptions;

    protected layers : Record<string, Layer[]> = {};

    // --------------------------------------------------

    constructor(path: Path) {
        this.path = path;

        this.pathMatcherOptions = { end: true, strict: this.isStrictPath() };
        this.pathMatcher = new PathMatcher(path, this.pathMatcherOptions);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.pathMatcher.test(path);
    }

    matchMethod(method: string) : boolean {
        return Object.prototype.hasOwnProperty.call(this.layers, method.toLowerCase());
    }

    // --------------------------------------------------

    dispatch(
        req: Request,
        res: Response,
        meta: DispatcherMeta,
        done: Next,
    ) : void {
        if (!req.method) {
            done();
            return;
        }

        const name = req.method.toLowerCase();
        const layers = this.layers[name];

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
                setImmediate(() => done(err));
                return;
            }

            const layer = layers[index];
            layer.dispatch(req, res, { ...layerMeta }, next);
        };

        next();
    }

    // --------------------------------------------------

    register(method: `${Method}`, ...handlers: Handler[]) {
        this.layers[method] = [];

        for (let i = 0; i < handlers.length; i++) {
            const layer = new Layer(
                this.path,
                this.pathMatcherOptions,
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

    // --------------------------------------------------

    private isStrictPath() {
        return typeof this.path !== 'string' ||
            (this.path !== '/' && this.path.length !== 0);
    }
}
