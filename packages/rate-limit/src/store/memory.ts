/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncrementResponse, Options } from '../type';
import { Store } from './type';
import { calculateNextResetTime } from './utils';

export class MemoryStore implements Store {
    /**
     * The duration of time before which all hit counts are reset (in milliseconds).
     */
    windowMs!: number;

    /**
     * The map that stores the number of hits for each client in memory.
     */
    hits!: {
        [key: string]: number | undefined
    };

    /**
     * The time at which all hit counts will be reset.
     */
    resetTime!: Date;

    /**
     * Reference to the active timer.
     */
    interval?: NodeJS.Timer;

    /**
     * Method that initializes the store.
     *
     * @param options {Options} - The options used to setup the middleware.
     */
    init(options: Options): void {
        // Get the duration of a window from the options.
        this.windowMs = options.windowMs;

        // Then calculate the reset time using that.
        this.resetTime = calculateNextResetTime(this.windowMs);

        // Initialise the hit counter map.
        this.hits = {};

        // Reset hit counts for ALL clients every `windowMs` - this will also
        // re-calculate the `resetTime`
        this.interval = setInterval(async () => {
            await this.resetAll();
        }, this.windowMs);

        // Cleaning up the interval will be taken care of by the `shutdown` method.
        if (this.interval.unref) this.interval.unref();
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
    async increment(key: string): Promise<IncrementResponse> {
        const totalHits = (this.hits[key] ?? 0) + 1;
        this.hits[key] = totalHits;

        return {
            totalHits,
            resetTime: this.resetTime,
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
        const current = this.hits[key];

        if (current) this.hits[key] = current - 1;
    }

    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @public
     */
    async reset(key: string): Promise<void> {
        delete this.hits[key];
    }

    /**
     * Method to reset everyone's hit counter.
     *
     * @public
     */
    /* istanbul ignore next */
    async resetAll(): Promise<void> {
        this.hits = {};
        this.resetTime = calculateNextResetTime(this.windowMs);
    }
}
