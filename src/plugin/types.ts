import type { Path } from '../path';
import type { Router } from '../router';

export type PluginOptions = Record<string | symbol, any>;
export type PluginInstallFn<
    Options extends PluginOptions = PluginOptions,
> = (router: Router, options: Options) => any;

export type Plugin<
    Options extends PluginOptions = PluginOptions,
> = {
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
    install: PluginInstallFn<Options>
};

export type PluginInstallContext<Options = any> = {
    /**
     * The name property overwrites the name defined by the plugin.
     */
    name?: string,
    /**
     * By specifying a path, the plugin will be installed as a child router.
     */
    path?: Path,
    /**
     * Pass options to the plugin installation routine.
     */
    options: Options
};
