import { PluginErrorCode } from '../constants.ts';
import { PluginError } from '../module.ts';

export class PluginNotInstalledError extends PluginError {
    public readonly pluginName: string;

    public readonly helperName: string;

    constructor(pluginName: string, helperName: string) {
        super({
            message: `${helperName}() requires the "${pluginName}" plugin. ` +
                `Register it with: router.use(${pluginName}())`,
            code: PluginErrorCode.NOT_INSTALLED,
        });
        this.name = 'PluginNotInstalledError';
        this.pluginName = pluginName;
        this.helperName = helperName;
    }
}
