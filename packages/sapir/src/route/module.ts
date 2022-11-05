/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { pathToRegexp } from 'path-to-regexp';
import { Method } from '../constants';
import { Layer } from '../layer';
import { useRequestRelativePath } from '../helpers';
import { Next, Request, Response } from '../type';

export class Route {
    readonly '@instanceof' = Symbol.for('Route');

    public path : string;

    protected regexp : RegExp;

    protected layers : Record<string, Layer> = {};

    // --------------------------------------------------

    constructor(path: string) {
        this.path = path;

        this.regexp = pathToRegexp(path);
    }

    // --------------------------------------------------

    matchPath(path: string) : boolean {
        return this.regexp.test(path);
    }

    matchMethod(method: string) : boolean {
        return Object.prototype.hasOwnProperty.call(this.layers, method.toLowerCase());
    }

    // --------------------------------------------------

    dispatch(
        req: Request,
        res: Response,
        done: Next,
    ) : void {
        // todo: iterate first over layers than method handlers :)

        if (!req.method) {
            done();
            return;
        }

        const name = req.method.toLowerCase();
        const layer = this.layers[name];

        if (typeof layer === 'undefined') {
            done();

            return;
        }

        layer.exec(useRequestRelativePath(req));

        layer.dispatch(req, res, done);
    }

    // --------------------------------------------------

    register(method: `${Method}`, fn: CallableFunction) {
        this.layers[method] = new Layer(
            this.path,
            {
                end: true,
            },
            fn,
        );
    }

    get(fn: CallableFunction) {
        return this.register(Method.GET, fn);
    }

    post(fn: CallableFunction) {
        return this.register(Method.POST, fn);
    }

    put(fn: CallableFunction) {
        return this.register(Method.PUT, fn);
    }

    patch(fn: CallableFunction) {
        return this.register(Method.PATCH, fn);
    }

    delete(fn: CallableFunction) {
        return this.register(Method.DELETE, fn);
    }
}
