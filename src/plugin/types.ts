import type { Path } from '../path/index.ts';
import type { IRouter } from '../router/types.ts';

export type PluginInstallFn = (router: IRouter) => any;

export type Plugin = {
    /**
     * The name of the plugin.
     */
    name: string,
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
