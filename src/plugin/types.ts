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
     * Whether the plugin may only be installed once per App, regardless
     * of mount path.
     *
     * - `false` / omitted: the plugin can be installed multiple times
     *   at distinct mount paths (e.g. an assets plugin mounted at
     *   `/v1` and `/v2`). Re-installing at the *same* mount path still
     *   throws `PluginAlreadyInstalledError`.
     * - `true`: any second install on the same App throws, even at a
     *   different path. Use for cross-cutting plugins (CORS, body
     *   parsers, auth) where multiple instances would be a bug.
     *
     * Once a plugin name has been installed with `singleton: true`, no
     * further install of that name succeeds — the singleton claim is
     * sticky for the lifetime of the App.
     */
    singleton?: boolean,
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
