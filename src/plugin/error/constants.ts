export const PluginErrorCode = {
    PLUGIN: 'PLUGIN',
    NOT_INSTALLED: 'PLUGIN_NOT_INSTALLED',
    INSTALL: 'PLUGIN_INSTALL',
} as const;

export type PluginErrorCode = typeof PluginErrorCode[keyof typeof PluginErrorCode];
