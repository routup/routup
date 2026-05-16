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
