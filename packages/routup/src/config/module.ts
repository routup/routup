/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { hasOwnProperty } from 'smob';
import { ObjectLiteral } from '../type';
import { ConfigContext, ConfigOptionsTransformer } from './type';

export class Config<
    O extends ObjectLiteral,
    I extends { [T in keyof O]?: any } = O,
> {
    protected options : Partial<O>;

    protected defaults: O;

    protected transformer: ConfigOptionsTransformer<O>;

    // -------------------------------------------------

    constructor(context: ConfigContext<O>) {
        this.options = context.options || {};
        this.defaults = context.defaults;
        this.transformer = context.transform;
    }

    // -------------------------------------------------

    set<K extends keyof O>(key: K, value: I[K]) : this {
        this.options[key] = this.transformer(key, value);

        return this;
    }

    has(key: keyof O) : boolean {
        return hasOwnProperty(this.options, key);
    }

    // ----------------------------------------------

    reset() : this;

    reset(key: keyof O) : this;

    reset(keys: (keyof O)[]) : this;

    reset(key?: (keyof O) | (keyof O)[]) : this {
        if (typeof key === 'undefined') {
            this.options = {};
            return this;
        }

        if (Array.isArray(key)) {
            for (let i = 0; i < key.length; i++) {
                this.reset(key[i]);
            }

            return this;
        }

        if (hasOwnProperty(this.options, key)) {
            delete this.options[key];
        }

        return this;
    }

    // ----------------------------------------------

    get<K extends keyof O>(key: K) : O[K] {
        if (hasOwnProperty(this.options, key)) {
            return this.options[key] as O[K];
        }

        return this.defaults[key];
    }

    getRaw<K extends keyof O>(key: K) : O[K] | undefined {
        if (hasOwnProperty(this.options, key)) {
            return this.options[key] as O[K];
        }

        return undefined;
    }

    // -------------------------------------------------

    setDefault<K extends keyof O>(key: K, value: I[K]) : this {
        this.defaults[key] = this.transformer(key, value) as O[K];

        return this;
    }

    getDefault<K extends keyof O>(key: K) : O[K] {
        return this.defaults[key];
    }
}
