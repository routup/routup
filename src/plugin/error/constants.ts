export const PluginErrorCode = {
    PLUGIN: 'PLUGIN',
    NOT_INSTALLED: 'PLUGIN_NOT_INSTALLED',
    ALREADY_INSTALLED: 'PLUGIN_ALREADY_INSTALLED',
    INSTALL: 'PLUGIN_INSTALL',
    DEPENDENCY: 'PLUGIN_DEPENDENCY',
} as const;

export type PluginErrorCode = typeof PluginErrorCode[keyof typeof PluginErrorCode];
