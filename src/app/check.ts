import type { IApp } from './types.ts';

/**
 * Structural check for an `IApp` — true when `input` exposes the
 * surface `flatten()` reads at mount time (`fetch`, `routes`,
 * `plugins`, `pluginSingletons`). Used by `App.use()` to discriminate
 * a child-App argument from handlers and plugins.
 *
 * Structural rather than brand-based so any object implementing
 * `IApp` — not just instances of the bundled `App` class — can be
 * mounted via `app.use(child)`.
 */
export function isAppInstance(input: unknown): input is IApp {
    if (typeof input !== 'object' || input === null) {
        return false;
    }
    const candidate = input as Record<string, unknown>;
    return typeof candidate.fetch === 'function' &&
        typeof candidate.routes === 'object' &&
        candidate.routes !== null &&
        typeof candidate.plugins === 'object' &&
        candidate.plugins !== null &&
        typeof candidate.pluginSingletons === 'object' &&
        candidate.pluginSingletons !== null;
}
