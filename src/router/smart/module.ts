import type { ICache } from '../../cache/index.ts';
import type { ObjectLiteral, Route, RouteMatch } from '../../types.ts';
import { LinearRouter } from '../linear/index.ts';
import { TrieRouter } from '../trie/index.ts';
import type { BaseRouterOptions, IRouter } from '../types.ts';

/**
 * Default crossover. Empirically `LinearRouter` wins for small route
 * counts (no per-request trie walk overhead, no static-spine setup);
 * `TrieRouter` wins past ~30 entries on typical workloads. Override
 * via `SmartRouterOptions.threshold` when a benchmark says otherwise
 * for your route shape.
 */
const DEFAULT_THRESHOLD = 30;

export type SmartRouterOptions<T extends ObjectLiteral = ObjectLiteral> = BaseRouterOptions<T> & {
    /**
         * Route count at or above which `SmartRouter` switches from
         * `LinearRouter` (faster at small N) to `TrieRouter` (faster
         * at large N). Default `30`.
         */
    threshold?: number;
};

/**
 * Auto-selecting router. Accumulates registered routes in a pending
 * buffer; on the first `lookup()` call, picks `LinearRouter` or
 * `TrieRouter` based on the registered route count and replays the
 * pending list onto the chosen inner router. Every subsequent call
 * — `add`, `lookup`, `clone` — forwards to the inner.
 *
 * Use this when you don't want to commit to a router family up-front
 * (e.g. a library that registers a variable number of routes
 * depending on configuration). For known workloads, prefer the
 * concrete router — `SmartRouter` adds one indirection per call.
 *
 * Inspired by Hono's `SmartRouter` (which auto-selects across more
 * candidates including `RegExpRouter`); ours covers the only choice
 * that matters in routup today: linear-vs-trie at the registration-
 * size crossover.
 */
export class SmartRouter<T extends ObjectLiteral = ObjectLiteral> implements IRouter<T> {
    protected inner?: IRouter<T>;

    protected pending: Route<T>[] = [];

    protected readonly threshold: number;

    /**
     * Cache handed off to whichever inner router gets chosen. Stays
     * `undefined` if the user didn't configure one.
     */
    protected readonly cache?: ICache<readonly RouteMatch<T>[]>;

    constructor(options: SmartRouterOptions<T> = {}) {
        this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
        this.cache = options.cache;
    }

    add(route: Route<T>): void {
        if (this.inner) {
            this.inner.add(route);
            return;
        }
        this.pending.push(route);
    }

    lookup(path: string, method?: string): readonly RouteMatch<T>[] {
        if (!this.inner) {
            this.inner = this.choose();
            for (const r of this.pending) {
                this.inner.add(r);
            }
            this.pending = [];
        }
        return this.inner.lookup(path, method);
    }

    clone(): IRouter<T> {
        // A fresh `SmartRouter` — uncommitted, ready to re-decide
        // based on its own registrations. Cache *shape* is carried
        // forward (not contents) the same way the leaf routers do
        // it; the inner router will receive it on first lookup.
        return new SmartRouter<T>({
            threshold: this.threshold,
            cache: this.cache?.clone(),
        });
    }

    /**
     * Pick the inner router based on the registered route count.
     * `LinearRouter` for tiny tables, `TrieRouter` past the
     * configured threshold.
     *
     * @protected
     */
    protected choose(): IRouter<T> {
        if (this.pending.length < this.threshold) {
            return new LinearRouter<T>({ cache: this.cache });
        }
        return new TrieRouter<T>({ cache: this.cache });
    }
}
