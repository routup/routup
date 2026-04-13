import { PluginErrorCode } from '../constants.ts';
import { PluginError } from '../module.ts';

export class PluginDependencyError extends PluginError {
    public readonly pluginName: string;

    public readonly dependencyName: string;

    constructor(pluginName: string, dependencyName: string, detail?: string) {
        let message: string;
        if (detail) {
            message = `Plugin "${pluginName}" requires "${dependencyName}": ${detail}`;
        } else {
            message = `Plugin "${pluginName}" requires plugin "${dependencyName}" to be installed first. ` +
                'Register the dependency plugin before this one.';
        }

        super({
            message,
            code: PluginErrorCode.DEPENDENCY,
        });
        this.name = 'PluginDependencyError';
        this.pluginName = pluginName;
        this.dependencyName = dependencyName;
    }
}
