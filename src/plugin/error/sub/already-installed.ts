import { PluginErrorCode } from '../constants.ts';
import { PluginError } from '../module.ts';

export class PluginAlreadyInstalledError extends PluginError {
    public readonly pluginName: string;

    constructor(pluginName: string) {
        super({
            message: `Plugin "${pluginName}" is already installed on this router.`,
            code: PluginErrorCode.ALREADY_INSTALLED,
        });
        this.name = 'PluginAlreadyInstalledError';
        this.pluginName = pluginName;
    }
}
