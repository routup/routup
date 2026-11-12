import { describe, expect, it } from 'vitest';
import {
    PluginRegistry,
    buildPluginMountKey,
} from '../../../src/plugin/registry.ts';
import type { PluginRegistryInput } from '../../../src/plugin/registry.ts';

type Install = PluginRegistryInput & { key: string };

function registryOf(installs: Install[]): PluginRegistry {
    const registry = new PluginRegistry();

    for (const install of installs) {
        if (registry.canInstall(install, install.key)) {
            registry.record(install, install.key);
        }
    }

    return registry;
}

function toObject(registry: PluginRegistry) {
    const output: Record<string, Record<string, string | undefined>> = {};

    for (const [name, paths] of registry.entries) {
        output[name] = Object.fromEntries(paths);
    }

    return output;
}

describe('src/plugin/registry', () => {
    describe('buildPluginMountKey', () => {
        it.each([
            [[], '/'],
            [[undefined], '/'],
            [[undefined, undefined], '/'],
            [['/'], '/'],
            [['/api'], '/api'],
            [['/api/'], '/api'],
            [['/api', '/v1'], '/api/v1'],
            [[undefined, '/v1'], '/v1'],
            [['/api', undefined, '/'], '/api'],
            [['/api', '/v1', '/admin'], '/api/v1/admin'],
        ] as [(string | undefined)[], string][])('%j -> %s', (parts, expected) => {
            expect(buildPluginMountKey(...parts)).toBe(expected);
        });
    });

    describe('canInstall', () => {
        it.each<[string, Install[], Install, boolean]>([
            ['empty registry', [], { name: 'p', key: '/' }, true],
            ['plain, same name and key', [{ name: 'p', key: '/' }], { name: 'p', key: '/' }, true],
            ['plain, same name other key', [{ name: 'p', key: '/' }], { name: 'p', key: '/a' }, true],
            ['singleton, empty registry', [], {
                name: 'p',
                singleton: true,
                key: '/',
            }, true],
            ['singleton, name already installed', [{ name: 'p', key: '/a' }], {
                name: 'p',
                singleton: true,
                key: '/',
            }, false],
            ['singleton, other name installed', [{ name: 'q', key: '/' }], {
                name: 'p',
                singleton: true,
                key: '/',
            }, true],
            ['plain, name claimed singleton', [{
                name: 'p',
                singleton: true,
                key: '/',
            }], { name: 'p', key: '/b' }, false],
            ['singletonByPath, same key', [{ name: 'p', key: '/a' }], {
                name: 'p',
                singletonByPath: true,
                key: '/a',
            }, false],
            ['singletonByPath, other key', [{ name: 'p', key: '/a' }], {
                name: 'p',
                singletonByPath: true,
                key: '/b',
            }, true],
            ['singletonByPath, name claimed singleton', [{
                name: 'p',
                singleton: true,
                key: '/a',
            }], {
                name: 'p',
                singletonByPath: true,
                key: '/b',
            }, false],
        ])('%s -> %s', (_label, installs, next, expected) => {
            const registry = registryOf(installs);

            expect(registry.canInstall(next, next.key)).toBe(expected);
        });
    });

    describe('record', () => {
        it('should write the latest version for the same name and key', () => {
            const registry = registryOf([
                {
                    name: 'p',
                    version: '1.0.0',
                    key: '/',
                },
                {
                    name: 'p',
                    version: '2.0.0',
                    key: '/',
                },
            ]);

            expect(toObject(registry)).toEqual({ p: { '/': '2.0.0' } });
        });

        it('should claim the name only for a singleton install', () => {
            const registry = registryOf([
                { name: 'p', key: '/' },
                {
                    name: 'q',
                    singleton: true,
                    key: '/',
                },
                {
                    name: 'r',
                    singletonByPath: true,
                    key: '/',
                },
            ]);

            expect([...registry.singletons]).toEqual(['q']);
        });

        it('should not claim a name retroactively when a singleton install is skipped', () => {
            const registry = registryOf([
                { name: 'p', key: '/' },
                {
                    name: 'p',
                    singleton: true,
                    key: '/a',
                },
                { name: 'p', key: '/b' },
            ]);

            expect(registry.singletons.has('p')).toBe(false);
            expect(toObject(registry)).toEqual({ p: { '/': undefined, '/b': undefined } });
        });
    });

    describe('queries', () => {
        const registry = registryOf([
            {
                name: 'p',
                version: '1.0.0',
                key: '/',
            },
            {
                name: 'p',
                version: '1.0.0',
                key: '/api',
            },
            { name: 'q', key: '/admin' },
        ]);

        it.each<[string, () => unknown, unknown]>([
            ['has p', () => registry.has('p'), true],
            ['has q', () => registry.has('q'), true],
            ['has x', () => registry.has('x'), false],
            ['hasAt p /', () => registry.hasAt('p', '/'), true],
            ['hasAt p /api', () => registry.hasAt('p', '/api'), true],
            ['hasAt p /admin', () => registry.hasAt('p', '/admin'), false],
            ['hasAt x /', () => registry.hasAt('x', '/'), false],
            ['getVersion p', () => registry.getVersion('p'), '1.0.0'],
            ['getVersion q', () => registry.getVersion('q'), undefined],
            ['getVersion x', () => registry.getVersion('x'), undefined],
            ['getVersionAt p /api', () => registry.getVersionAt('p', '/api'), '1.0.0'],
            ['getVersionAt p /admin', () => registry.getVersionAt('p', '/admin'), undefined],
            ['getVersionAt x /', () => registry.getVersionAt('x', '/'), undefined],
            ['getMountPaths p', () => registry.getMountPaths('p'), ['/', '/api']],
            ['getMountPaths q', () => registry.getMountPaths('q'), ['/admin']],
            ['getMountPaths x', () => registry.getMountPaths('x'), []],
        ])('%s', (_label, query, expected) => {
            expect(query()).toEqual(expected);
        });
    });

    describe('merge', () => {
        type MergeCase = {
            label: string,
            parent: Install[],
            child: Install[],
            prefix: (string | undefined)[],
            entries: Record<string, Record<string, string | undefined>>,
            singletons: string[],
        };

        it.each<MergeCase>([
            {
                label: 'lifts child keys under the prefix',
                parent: [],
                child: [{
                    name: 'p',
                    version: '1',
                    key: '/',
                }, {
                    name: 'p',
                    version: '1',
                    key: '/x',
                }],
                prefix: ['/base', '/api'],
                entries: { p: { '/base/api': '1', '/base/api/x': '1' } },
                singletons: [],
            },
            {
                label: 'root mount without prefix keeps child keys',
                parent: [],
                child: [{ name: 'p', key: '/' }],
                prefix: [undefined, undefined],
                entries: { p: { '/': undefined } },
                singletons: [],
            },
            {
                label: 'first writer wins on the same composed key',
                parent: [{
                    name: 'p',
                    version: 'parent',
                    key: '/api',
                }],
                child: [{
                    name: 'p',
                    version: 'child',
                    key: '/',
                }, {
                    name: 'p',
                    version: 'child',
                    key: '/x',
                }],
                prefix: ['/api'],
                entries: { p: { '/api': 'parent', '/api/x': 'child' } },
                singletons: [],
            },
            {
                label: 'child claim propagates for a name the parent did not have',
                parent: [],
                child: [{
                    name: 'p',
                    singleton: true,
                    key: '/',
                }],
                prefix: ['/api'],
                entries: { p: { '/api': undefined } },
                singletons: ['p'],
            },
            {
                label: 'child claim merges entries but does not propagate for a name the parent had',
                parent: [{ name: 'p', key: '/' }],
                child: [{
                    name: 'p',
                    singleton: true,
                    key: '/',
                }],
                prefix: ['/api'],
                entries: { p: { '/': undefined, '/api': undefined } },
                singletons: [],
            },
            {
                label: 'parent claim blocks the merge of that name',
                parent: [{
                    name: 'p',
                    singleton: true,
                    key: '/',
                }],
                child: [{ name: 'p', key: '/' }, { name: 'q', key: '/' }],
                prefix: ['/api'],
                entries: { p: { '/': undefined }, q: { '/api': undefined } },
                singletons: ['p'],
            },
            {
                label: 'parent claim stays when the child also claims the name',
                parent: [{
                    name: 'p',
                    singleton: true,
                    key: '/',
                }],
                child: [{
                    name: 'p',
                    singleton: true,
                    key: '/',
                }],
                prefix: ['/api'],
                entries: { p: { '/': undefined } },
                singletons: ['p'],
            },
        ])('$label', ({
            parent,
            child,
            prefix,
            entries,
            singletons,
        }) => {
            const registry = registryOf(parent);
            const source = registryOf(child);

            registry.merge(
                { plugins: source.entries, pluginSingletons: source.singletons },
                ...prefix,
            );

            expect(toObject(registry)).toEqual(entries);
            expect([...registry.singletons].sort()).toEqual(singletons);
        });

        it('should read a structural source', () => {
            const registry = new PluginRegistry();

            registry.merge({
                plugins: new Map([['p', new Map([['/', '1.0.0']])]]),
                pluginSingletons: new Set(['p']),
            }, '/api');

            expect(registry.getVersionAt('p', '/api')).toBe('1.0.0');
            expect(registry.singletons.has('p')).toBe(true);
        });
    });
});
