import { describe, expect, it } from 'vitest';
import {
    PluginError,
    PluginErrorCode,
    PluginInstallError,
    PluginNotInstalledError,
    RoutupError,
    createError,
    isPluginError,
} from '../../../src';
import { isError } from '../../../src/error/is.ts';

describe('src/plugin/error', () => {
    describe('PluginError', () => {
        it('should create a plugin error', () => {
            const error = new PluginError({ message: 'something went wrong' });
            expect(error).toBeInstanceOf(PluginError);
            expect(error).toBeInstanceOf(RoutupError);
            expect(error.name).toBe('PluginError');
            expect(error.code).toBe(PluginErrorCode.PLUGIN);
            expect(error.message).toBe('something went wrong');
        });

        it('should be detected by isPluginError', () => {
            const error = new PluginError();
            expect(isPluginError(error)).toBe(true);
        });

        it('should be detected by isError', () => {
            const error = new PluginError();
            expect(isError(error)).toBe(true);
        });
    });

    describe('PluginNotInstalledError', () => {
        it('should create error with plugin and helper names', () => {
            const error = new PluginNotInstalledError('cookie', 'useRequestCookies');
            expect(error).toBeInstanceOf(PluginNotInstalledError);
            expect(error).toBeInstanceOf(PluginError);
            expect(error).toBeInstanceOf(RoutupError);
            expect(error.name).toBe('PluginNotInstalledError');
            expect(error.code).toBe(PluginErrorCode.NOT_INSTALLED);
            expect(error.pluginName).toBe('cookie');
            expect(error.helperName).toBe('useRequestCookies');
        });

        it('should have descriptive message', () => {
            const error = new PluginNotInstalledError('cookie', 'useRequestCookies');
            expect(error.message).toContain('useRequestCookies()');
            expect(error.message).toContain('"cookie"');
            expect(error.message).toContain('router.use(cookie())');
        });

        it('should be detected by isPluginError', () => {
            const error = new PluginNotInstalledError('cookie', 'useRequestCookies');
            expect(isPluginError(error)).toBe(true);
        });

        it('should be detected by isError', () => {
            const error = new PluginNotInstalledError('cookie', 'useRequestCookies');
            expect(isError(error)).toBe(true);
        });

        it('should be wrapped by createError without losing properties', () => {
            const error = new PluginNotInstalledError('cookie', 'useRequestCookies');
            const wrapped = createError(error);
            expect(wrapped).toBe(error);
        });
    });

    describe('PluginInstallError', () => {
        it('should create error with plugin name', () => {
            const error = new PluginInstallError('cookie');
            expect(error).toBeInstanceOf(PluginInstallError);
            expect(error).toBeInstanceOf(PluginError);
            expect(error).toBeInstanceOf(RoutupError);
            expect(error.name).toBe('PluginInstallError');
            expect(error.code).toBe(PluginErrorCode.INSTALL);
            expect(error.pluginName).toBe('cookie');
            expect(error.message).toContain('"cookie"');
        });

        it('should preserve cause', () => {
            const cause = new Error('install failed');
            const error = new PluginInstallError('cookie', cause);
            expect(error.cause).toBe(cause);
        });

        it('should be detected by isPluginError', () => {
            const error = new PluginInstallError('cookie');
            expect(isPluginError(error)).toBe(true);
        });

        it('should be detected by isError', () => {
            const error = new PluginInstallError('cookie');
            expect(isError(error)).toBe(true);
        });

        it('should be wrapped by createError without losing properties', () => {
            const error = new PluginInstallError('cookie');
            const wrapped = createError(error);
            expect(wrapped).toBe(error);
        });
    });
});
