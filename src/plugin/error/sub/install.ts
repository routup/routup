import { PluginErrorCode } from '../constants.ts';
import { PluginError } from '../module.ts';

export class PluginInstallError extends PluginError {
    public readonly pluginName: string;

    constructor(pluginName: string, cause?: Error) {
        super({
            message: `Failed to install plugin "${pluginName}".`,
            code: PluginErrorCode.INSTALL,
            cause,
        });
        this.name = 'PluginInstallError';
        this.pluginName = pluginName;
    }
}
