import { hasInstanceof } from '@ebec/core';
import { isObject } from '../utils/index.ts';
import { AppSymbol } from './constants.ts';
import type { IApp } from './types.ts';

/**
 * Discriminate an `IApp` argument from handlers, plugins, and other
 * inputs `App.use()` accepts. Two-stage check:
 *
 *   1. Fast path: brand check (`hasInstanceof` against `AppSymbol`).
 *      Hits for every instance of the bundled `App` class and any
 *      subclass that calls `markInstanceof(this, AppSymbol)` — that's
 *      the common case, so we want it to be a single property lookup
 *      with no key-by-key probing.
 *
 *   2. Fallback: structural check for the `IApp` surface `flatten()`
 *      reads at mount time (`fetch`, `routes`, `plugins`,
 *      `pluginSingletons`). Lets any object implementing the `IApp`
 *      contract — not just instances of the bundled `App` class — be
 *      mounted via `app.use(child)`.
 */
export function isAppInstance(input: unknown): input is IApp {
    if (hasInstanceof(input, AppSymbol)) {
        return true;
    }
    if (!isObject(input)) {
        return false;
    }
    return typeof input.fetch === 'function' &&
        Array.isArray(input.routes) &&
        isObject(input.plugins) &&
        isObject(input.pluginSingletons);
}
