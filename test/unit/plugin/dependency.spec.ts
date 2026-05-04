import { describe, expect, it } from 'vitest';
import {
    PluginAlreadyInstalledError,
    PluginDependencyError,
    Router,
    defineCoreHandler,
} from '../../../src';
import type { Plugin } from '../../../src';
import { createTestRequest } from '../../helpers';

function cookiePlugin(version?: string): Plugin {
    return {
        name: '@routup/cookie',
        version,
        install: (router) => {
            router.get('/', defineCoreHandler(() => 'cookie'));
        },
    };
}

function buildCookieDep(options: {
    cookieVersion?: string,
    optional?: boolean,
}): string | {
    name: string,
    version?: string,
    optional?: boolean,
} {
    if (options.cookieVersion) {
        return {
            name: '@routup/cookie',
            version: options.cookieVersion,
            optional: options.optional,
        };
    }

    if (options.optional) {
        return { name: '@routup/cookie', optional: true };
    }

    return '@routup/cookie';
}

function basicPlugin(options: { cookieVersion?: string, optional?: boolean } = {}): Plugin {
    return {
        name: '@routup/basic',
        version: '1.0.0',
        dependencies: [buildCookieDep(options)],
        install: (router) => {
            router.get('/', defineCoreHandler(() => 'basic'));
        },
    };
}

describe('src/plugin dependency validation', () => {
    it('should throw when required dependency is missing', () => {
        const router = new Router();

        expect(() => router.use(basicPlugin())).toThrowError(PluginDependencyError);
    });

    it('should include plugin and dependency names in error', () => {
        const router = new Router();

        expect(() => router.use(basicPlugin())).toThrowError(
            /Plugin "@routup\/basic" requires plugin "@routup\/cookie"/,
        );
    });

    it('should succeed when dependency is installed first', async () => {
        const router = new Router();
        router.use(cookiePlugin());
        router.use(basicPlugin());

        const response = await router.fetch(createTestRequest('/'));
        expect(response.status).toEqual(200);
    });

    it('should skip optional dependency gracefully', () => {
        const router = new Router();

        expect(() => router.use(basicPlugin({ optional: true }))).not.toThrow();
    });

    it('should succeed with version constraint satisfied', () => {
        const router = new Router();
        router.use(cookiePlugin('2.1.0'));

        expect(() => router.use(basicPlugin({ cookieVersion: '>=2.0.0' }))).not.toThrow();
    });

    it('should throw when version constraint is not satisfied', () => {
        const router = new Router();
        router.use(cookiePlugin('1.5.0'));

        expect(() => router.use(basicPlugin({ cookieVersion: '>=2.0.0' }))).toThrowError(
            /version ">=2.0.0" required but "1.5.0" is installed/,
        );
    });

    it('should throw when version required but dependency has no version', () => {
        const router = new Router();
        router.use(cookiePlugin()); // no version

        expect(() => router.use(basicPlugin({ cookieVersion: '>=1.0.0' }))).toThrowError(
            /has no version/,
        );
    });

    it('should skip optional dependency version mismatch gracefully', () => {
        const router = new Router();
        router.use(cookiePlugin('0.5.0'));

        expect(() => router.use(basicPlugin({
            cookieVersion: '>=1.0.0',
            optional: true,
        }))).not.toThrow();
    });

    it('should skip optional dependency with no version gracefully', () => {
        const router = new Router();
        router.use(cookiePlugin());

        expect(() => router.use(basicPlugin({
            cookieVersion: '>=1.0.0',
            optional: true,
        }))).not.toThrow();
    });

    it('should find dependency on parent router', () => {
        const parent = new Router();
        parent.use(cookiePlugin('1.0.0'));

        const child = new Router();
        parent.use(child);

        // basicPlugin installed on child should resolve cookie via parent
        expect(() => child.use(basicPlugin())).not.toThrow();
    });

    it('should track plugin via hasPlugin', () => {
        const router = new Router();

        expect(router.hasPlugin('@routup/cookie')).toBe(false);

        router.use(cookiePlugin());

        expect(router.hasPlugin('@routup/cookie')).toBe(true);
    });

    it('should track plugin version via getPluginVersion', () => {
        const router = new Router();
        router.use(cookiePlugin('3.2.1'));

        expect(router.getPluginVersion('@routup/cookie')).toBe('3.2.1');
    });

    it('should support multiple dependencies', () => {
        const queryPlugin: Plugin = {
            name: '@routup/query',
            version: '1.0.0',
            install: (router) => {
                router.get('/', defineCoreHandler(() => 'query'));
            },
        };

        const multiDepPlugin: Plugin = {
            name: '@routup/multi',
            dependencies: ['@routup/cookie', '@routup/query'],
            install: (router) => {
                router.get('/', defineCoreHandler(() => 'multi'));
            },
        };

        const router = new Router();

        // missing both
        expect(() => router.use(multiDepPlugin)).toThrowError(PluginDependencyError);

        // install cookie, still missing query
        router.use(cookiePlugin());
        expect(() => router.use(multiDepPlugin)).toThrowError(/@routup\/query/);

        // install query, now both are present
        router.use(queryPlugin);
        expect(() => router.use(multiDepPlugin)).not.toThrow();
    });

    it('should allow plugin with no dependencies', () => {
        const router = new Router();

        expect(() => router.use(cookiePlugin())).not.toThrow();
    });

    it('should work with caret version constraint', () => {
        const router = new Router();
        router.use(cookiePlugin('1.2.3'));

        expect(() => router.use(basicPlugin({ cookieVersion: '^1.0.0' }))).not.toThrow();
    });

    it('should reject caret version with major mismatch', () => {
        const router = new Router();
        router.use(cookiePlugin('2.0.0'));

        expect(() => router.use(basicPlugin({ cookieVersion: '^1.0.0' }))).toThrowError(
            /version "\^1.0.0" required but "2.0.0" is installed/,
        );
    });

    it('should throw when installing the same plugin twice on the same router', () => {
        const router = new Router();
        router.use(cookiePlugin());

        expect(() => router.use(cookiePlugin())).toThrowError(PluginAlreadyInstalledError);
    });

    it('should allow installing the same plugin on a child router when the parent already has it', () => {
        const parent = new Router();
        parent.use(cookiePlugin('1.0.0'));

        const child = new Router();
        parent.use(child);

        expect(() => child.use(cookiePlugin('1.0.0'))).not.toThrow();
    });

    it('should expose plugins installed by a wrapper plugin via hasPlugin', () => {
        const wrapperPlugin: Plugin = {
            name: '@routup/basic',
            version: '1.0.0',
            install: (router) => {
                router.use(cookiePlugin('2.1.0'));
            },
        };

        const router = new Router();
        router.use(wrapperPlugin);

        expect(router.hasPlugin('@routup/basic')).toBe(true);
        expect(router.hasPlugin('@routup/cookie')).toBe(true);
        expect(router.getPluginVersion('@routup/cookie')).toBe('2.1.0');
    });

    it('should satisfy a dependency installed inside a wrapper plugin', () => {
        const wrapperPlugin: Plugin = {
            name: '@routup/basic',
            version: '1.0.0',
            install: (router) => {
                router.use(cookiePlugin('2.1.0'));
            },
        };

        const consumer: Plugin = {
            name: '@routup/decorators',
            dependencies: ['@routup/cookie'],
            install: (router) => {
                router.get('/', defineCoreHandler(() => 'decorators'));
            },
        };

        const router = new Router();
        router.use(wrapperPlugin);

        expect(() => router.use(consumer)).not.toThrow();
    });

    it('should satisfy a versioned dependency installed inside a wrapper plugin', () => {
        const wrapperPlugin: Plugin = {
            name: '@routup/basic',
            version: '1.0.0',
            install: (router) => {
                router.use(cookiePlugin('2.1.0'));
            },
        };

        const consumer: Plugin = {
            name: '@routup/decorators',
            dependencies: [{ name: '@routup/cookie', version: '>=2.0.0' }],
            install: (router) => {
                router.get('/', defineCoreHandler(() => 'decorators'));
            },
        };

        const router = new Router();
        router.use(wrapperPlugin);

        expect(() => router.use(consumer)).not.toThrow();
    });

    it('should propagate inner plugins transitively through nested wrappers', () => {
        const innerWrapper: Plugin = {
            name: '@routup/basic',
            install: (router) => {
                router.use(cookiePlugin('1.0.0'));
            },
        };

        const outerWrapper: Plugin = {
            name: '@routup/preset',
            install: (router) => {
                router.use(innerWrapper);
            },
        };

        const router = new Router();
        router.use(outerWrapper);

        expect(router.hasPlugin('@routup/preset')).toBe(true);
        expect(router.hasPlugin('@routup/basic')).toBe(true);
        expect(router.hasPlugin('@routup/cookie')).toBe(true);
    });

    it('should resolve nested plugin dependencies against ancestors during wrapper install', () => {
        const consumer: Plugin = {
            name: '@routup/inner-consumer',
            dependencies: ['@routup/cookie'],
            install: () => { /* no-op */ },
        };

        const wrapperPlugin: Plugin = {
            name: '@routup/wrapper',
            install: (router) => {
                // consumer's dependency lives on the parent router and must
                // be visible during the wrapper's install execution
                router.use(consumer);
            },
        };

        const router = new Router();
        router.use(cookiePlugin('1.0.0'));

        expect(() => router.use(wrapperPlugin)).not.toThrow();
    });
});
