import type { IApp } from '../app/types.ts';
import { joinPaths } from '../utils/index.ts';
import type { Plugin } from './types.ts';

/**
 * The plugin fields the registry reads to decide on and record an
 * install.
 */
export type PluginRegistryInput = Pick<Plugin, 'name' | 'version' | 'singleton' | 'singletonByPath'>;

/**
 * The public registry surface of a mounted child App. Read through
 * the `IApp` getters, so a structural `IApp` is mountable.
 */
export type PluginRegistrySource = Pick<IApp, 'plugins' | 'pluginSingletons'>;

/**
 * Join path parts into a canonical plugin mount key, falling back to
 * `'/'` for a root install.
 */
export function buildPluginMountKey(...parts: (string | undefined)[]): string {
    return joinPaths(...parts) ?? '/';
}

/**
 * Plugin bookkeeping of one App: which plugin names are installed at
 * which canonical mount keys, and which names are claimed singleton.
 * Internal: not exported from the `plugin` barrel.
 */
export class PluginRegistry {
    /**
     * Installed plugins, keyed by plugin name then by canonical mount
     * key. Inner-map value is the plugin version (or `undefined`).
     *
     * Per-path keying lets `hasAt` answer "is plugin X mounted at
     * /api?" precisely. By default an install is permissive and
     * appends — same `(name, key)` writes the latest version. Plugins
     * opt into deduplication via `singleton` (any-path) or
     * `singletonByPath` (same-path) flags.
     */
    protected _entries: Map<string, Map<string, string | undefined>> = new Map();

    /**
     * Names of plugins installed with `singleton: true`. Re-installing
     * any of these names — even at a different mount path — is a
     * silent no-op. The claim is sticky: once a name is in here, it
     * stays for the lifetime of the registry. Propagated through
     * `merge()` so a child's singleton claim survives the mount.
     */
    protected _singletons: Set<string> = new Set();

    // --------------------------------------------------

    get entries(): ReadonlyMap<string, ReadonlyMap<string, string | undefined>> {
        return this._entries;
    }

    get singletons(): ReadonlySet<string> {
        return this._singletons;
    }

    // --------------------------------------------------

    /**
     * Decide whether an install of `plugin` at `mountKey` may proceed.
     * Every refusal is a silent skip for the caller.
     */
    canInstall(plugin: PluginRegistryInput, mountKey: string): boolean {
        // Sticky claim: a previous successful `singleton: true` install
        // locked this name. Every further install is a silent no-op so
        // an idempotent `app.use(plugin)` is safe to call from setup
        // code that doesn't know whether the plugin is already mounted.
        if (this._singletons.has(plugin.name)) {
            return false;
        }

        const existing = this._entries.get(plugin.name);

        // This install opts into singleton but the name is already
        // mounted at some path. Silent skip — we do *not* retroactively
        // claim the name singleton, so a later non-flagged install of
        // the same name can still succeed (first-install-wins).
        if (plugin.singleton && existing && existing.size > 0) {
            return false;
        }

        // SingletonByPath: silently skip a second install at the same
        // canonical mount path. Installs at other paths still proceed.
        if (plugin.singletonByPath && existing && existing.has(mountKey)) {
            return false;
        }

        return true;
    }

    /**
     * Record a completed install of `plugin` at `mountKey`, and claim
     * the name when the plugin is a singleton.
     */
    record(plugin: PluginRegistryInput, mountKey: string): void {
        let entry = this._entries.get(plugin.name);

        if (!entry) {
            entry = new Map();
            this._entries.set(plugin.name, entry);
        }

        entry.set(mountKey, plugin.version);

        if (plugin.singleton) {
            this._singletons.add(plugin.name);
        }
    }

    /**
     * Merge a mounted child's registry into this one. Each child key
     * is in the child's canonical path space; joining it under
     * `prefix` lifts it into this registry's canonical space.
     */
    merge(source: PluginRegistrySource, ...prefix: (string | undefined)[]): void {
        // Snapshot which plugin names this registry already had
        // *before* the merge. The sticky-claim propagation below uses
        // this to honor the same first-install-wins rule `canInstall()`
        // enforces — a child's `singleton: true` claim must not
        // retroactively lock a name the parent already installed
        // non-singleton.
        const namesBeforeMerge = new Set(this._entries.keys());

        // Note: this branch is intentionally asymmetric with
        // `canInstall()`. An install with `singleton: true` against an
        // existing entry suppresses *both* the install and the claim.
        // A merge with a child-side sticky claim against an existing
        // parent entry still merges the entry — child routes have
        // already propagated unconditionally, and suppressing the
        // registry record too would leave `hasAt` lying about routes
        // that are demonstrably mounted.
        for (const [name, childPaths] of source.plugins) {
            // Sticky claim on this side blocks the merge of child's
            // entries for that name. The claim is forward-looking; the
            // child's routes are not dropped — only the registry
            // record, so `hasAt` reflects the locked namespace.
            if (this._singletons.has(name)) {
                continue;
            }

            let entry = this._entries.get(name);

            for (const [childKey, version] of childPaths) {
                const composedKey = buildPluginMountKey(...prefix, childKey);

                // Silent dedup — first writer wins for the same
                // composed key, mirroring the install-side silent skip.
                if (entry && entry.has(composedKey)) {
                    continue;
                }

                if (!entry) {
                    entry = new Map();
                    this._entries.set(name, entry);
                }

                entry.set(composedKey, version);
            }
        }

        // Propagate sticky singleton claims so a child's contract
        // survives the mount — but only for names this registry did
        // not already have. Mirrors the install-side rule that a
        // `singleton: true` install on a previously-claimed name is a
        // silent no-op without claiming; a merge would otherwise leak
        // child claims into a parent that had its own non-singleton
        // install of the same name.
        for (const name of source.pluginSingletons) {
            if (!namesBeforeMerge.has(name)) {
                this._singletons.add(name);
            }
        }
    }

    // --------------------------------------------------

    /**
     * Check if a plugin with the given name is installed at *any*
     * mount key.
     */
    has(name: string): boolean {
        const entry = this._entries.get(name);

        return !!entry && entry.size > 0;
    }

    /**
     * Check if a plugin with the given name is installed at the given
     * canonical mount key.
     */
    hasAt(name: string, mountKey: string): boolean {
        const entry = this._entries.get(name);

        if (!entry) {
            return false;
        }

        return entry.has(mountKey);
    }

    /**
     * Get the version of an installed plugin by name, or `undefined`
     * when the plugin is not installed. When the plugin is mounted at
     * several keys, returns the version of an arbitrary mount.
     */
    getVersion(name: string): string | undefined {
        const entry = this._entries.get(name);

        if (!entry) {
            return undefined;
        }

        const first = entry.values().next();

        return first.done ? undefined : first.value;
    }

    /**
     * Get the version of a plugin installed at the given canonical
     * mount key, or `undefined` when no install matches.
     */
    getVersionAt(name: string, mountKey: string): string | undefined {
        const entry = this._entries.get(name);

        if (!entry) {
            return undefined;
        }

        return entry.get(mountKey);
    }

    /**
     * List every canonical mount key the named plugin is installed at.
     * Returns an empty array when the plugin is not installed.
     */
    getMountPaths(name: string): readonly string[] {
        const entry = this._entries.get(name);

        if (!entry) {
            return [];
        }

        return Array.from(entry.keys());
    }
}
