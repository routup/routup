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
     * By specifying a path, the plugin will be installed as a child router.
     */
    path?: Path,
};
