/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { Client, createClient, useClient } from 'redis-extension';
import {
    IncrementResponse,
    Options,
    Store,
    calculateNextResetTime,
} from '@routup/rate-limit';

export class RedisStore implements Store {
    options!: Options;

    client : Client;

    constructor(connectionString?: string) {
        if (typeof connectionString === 'undefined') {
            this.client = useClient();
        } else {
            this.client = createClient({
                connectionString,
            });
        }
    }

    /**
     * Method that initializes the store.
     *
     * @param options {Options} - The options used to setup the middleware.
     */
    init(options: Options) : void {
        this.options = options;
    }

    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {IncrementResponse} - The number of hits and reset time for that client.
     *
     * @public
     */
    async increment(key: string) : Promise<IncrementResponse> {
        key = this.buildKey(key);
        const entry = await this.client.get(key);

        let totalHits : number;
        if (entry) {
            totalHits = parseInt(entry, 10) + 1;
        } else {
            totalHits = 1;
        }

        this.client.set(
            key,
            totalHits,
            'PX',
            this.options.windowMs,
        );

        const resetTime = calculateNextResetTime(this.options.windowMs);

        return {
            totalHits,
            resetTime,
        };
    }

    /**
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @public
     */
    async decrement(key: string): Promise<void> {
        key = this.buildKey(key);
        const entry = await this.client.get(key);
        if (entry) {
            const totalHits = parseInt(entry, 10) - 1;

            this.client.set(
                key,
                totalHits,
                'PX',
                this.options.windowMs,
            );
        }
    }

    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @public
     */
    async reset(key: string) : Promise<void> {
        key = this.buildKey(key);

        this.client.del(key);
    }

    /**
     * Method to build redis key.
     *
     * @param key
     * @protected
     */
    protected buildKey(key: string) {
        return `rate-limit:${key}`;
    }
}
