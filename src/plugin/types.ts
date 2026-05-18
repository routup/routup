import type { Path } from '../path/index.ts';
import type { IApp } from '../app/types.ts';

export type PluginInstallFn = (router: IApp) => any;

export type Plugin = {
    /**
     * The name of the plugin.
     */
    name: string,
    /**
     * The version of the plugin (semver).
     */
    version?: string,
    /**
     * Opt in to "install at most once per App, regardless of mount
     * path". Use for cross-cutting plugins (CORS, body parsers, auth)
     * where multiple instances would be a bug.
     *
     * Default `false` — by default `app.use(plugin)` is permissive and
     * appends; the same plugin may even be mounted at the same path
     * more than once (each install runs `install()` again and stacks).
     *
     * When `true`:
     *   - The install is a no-op if any prior mount of the same name
     *     exists. Routes from this attempt are not registered, and no
     *     error is thrown.
     *   - The first successful install with `singleton: true` records
     *     a sticky claim — every subsequent install of that name is
     *     silently skipped for the lifetime of the App.
     *   - The claim is *not* set retroactively. If the first install
     *     of the name had no flag, a later `singleton: true` install
     *     just no-ops without claiming.
     */
    singleton?: boolean,
    /**
     * Opt in to "install at most once per `(name, mount path)` pair".
     * Useful for idempotent installs at a specific prefix without
     * locking the name globally.
     *
     * Default `false`. When `true`, a second install of the same
     * plugin at the same canonical mount path is silently skipped;
     * installs at other paths proceed normally.
     */
    singletonByPath?: boolean,
    /**
     * The installation function called on registration.
     */
    install: PluginInstallFn
};

export type PluginInstallContext = {
    /**
     * Mount-path prefix to prepend onto every route the plugin
     * registers. Equivalent to passing the same prefix to
     * `app.use(path, plugin)`. The plugin installs into a scratch
     * `App`; that scratch is then flattened into the host App with
     * this prefix joined onto each route.
     */
    path?: Path,
};
