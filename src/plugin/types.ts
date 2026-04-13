import type { Path } from '../path/index.ts';
import type { IRouter } from '../router/types.ts';

export type PluginInstallFn = (router: IRouter) => any;

export type PluginDependency = {
    /**
     * The name of the required plugin.
     */
    name: string,
    /**
     * Semver constraint, e.g. '>=2.0.0', '^1.0.0'.
     * If omitted, any version satisfies the dependency.
     */
    version?: string,
    /**
     * When true, the dependency is skipped gracefully if unavailable.
     */
    optional?: boolean,
};

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
     * Plugins that must be installed before this one.
     * Each entry can be a plugin name string or a PluginDependency object.
     */
    dependencies?: (string | PluginDependency)[],
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
