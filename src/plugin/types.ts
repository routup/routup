import type { Path } from '../path';
import type { Router } from '../router';

export type PluginOptions = Record<string | symbol, any>;
export type PluginInstallFn = (router: Router) => any;

export type Plugin = {
    /**
     * The name of the plugin.
     */
    name: string,
    /**
     *  The supported routup (semver) version.
     */
    version?: string,
    /**
     * The installation function called on registration.
     */
    install: PluginInstallFn
};

export type PluginInstallContext = {
    /**
     * The name property overwrites the name defined by the plugin.
     */
    name?: string,
    /**
     * By specifying a path, the plugin will be installed as a child router.
     */
    path?: Path,
};
