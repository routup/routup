import {
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    ENTRY_ONLY,
    EXEMPT,
    readDocumentedNames,
    readExports,
    readHiddenNames,
} from './api-names';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const apiDir = path.join(rootDir, 'docs', 'src', 'api');

// Building the TypeScript program takes a few seconds; do it once per file.
const exports = readExports(path.join(rootDir, 'src', 'index.ts'));

describe('docs/api-names: readDocumentedNames', () => {
    it('should pick a level 3 heading with one backticked identifier', () => {
        expect(readDocumentedNames('### `getRequestHeader`\n\ntext')).toEqual(['getRequestHeader']);
    });

    it('should accept a trailing call suffix', () => {
        expect(readDocumentedNames('### `createError()`')).toEqual(['createError']);
    });

    it('should pick a heading indented by up to three spaces', () => {
        expect(readDocumentedNames('   ### `App`\n\n    ### `Indented`')).toEqual(['App']);
    });

    it('should pick a level 2 heading', () => {
        expect(readDocumentedNames('## `App`')).toEqual(['App']);
    });

    it('should ignore plain text headings', () => {
        expect(readDocumentedNames('## Headers & Content Negotiation\n\n## Methods')).toEqual([]);
    });

    it('should ignore other heading levels and mixed headings', () => {
        expect(readDocumentedNames('# `App`\n\n#### `App`\n\n### `app.get`\n\n### The `App` class')).toEqual([]);
    });

    it('should ignore headings inside code fences', () => {
        const markdown = [
            '```md',
            '### `inFence`',
            '```',
            '',
            '~~~',
            '## `alsoInFence`',
            '~~~',
            '',
            '### `outside`',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual(['outside']);
    });

    it('should close a fence only on a bare fence line', () => {
        const markdown = [
            '````md',
            '```ts',
            '### `inFence`',
            '````',
            '',
            '### `outside`',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual(['outside']);
    });

    it('should not close a fence on a line with an info string', () => {
        const markdown = [
            '```',
            '```ts',
            '### `inFence`',
            '```',
        ].join('\n');

        expect(readDocumentedNames(markdown)).toEqual([]);
    });
});

describe('docs/api-names: readHiddenNames', () => {
    it('should report a backticked name followed by other text', () => {
        const markdown = [
            '### `isPlugin` <Badge type="info" text="beta" />',
            '## `App` {#app}',
            '### `createError()` helper',
        ].join('\n');

        expect(readHiddenNames(markdown)).toEqual([
            '### `isPlugin` <Badge type="info" text="beta" />',
            '## `App` {#app}',
            '### `createError()` helper',
        ]);
    });

    it('should report a heading that starts with any backticked span', () => {
        const markdown = [
            '### `IRouter<T>` x',
            '### `IRouter<T>`',
            '### `app.get()` shortcut',
            '   ### `App` {#app}',
        ].join('\n');

        expect(readHiddenNames(markdown)).toEqual([
            '### `IRouter<T>` x',
            '### `IRouter<T>`',
            '### `app.get()` shortcut',
            '   ### `App` {#app}',
        ]);
    });

    it('should accept exact headings, plain headings and other levels', () => {
        const markdown = [
            '### `isPlugin`',
            '### `createError()`',
            '  ## `App`',
            '### The `App` class',
            '### app.get()',
            '#### `App` extra',
            '    ### `App` x',
        ].join('\n');

        expect(readHiddenNames(markdown)).toEqual([]);
    });

    it('should ignore headings inside code fences', () => {
        expect(readHiddenNames('```md\n### `App` text\n```')).toEqual([]);
    });
});

describe('docs/api-names: readExports', () => {
    it('should classify classes, functions and const objects as values', () => {
        expect(exports.values.has('App')).toBe(true);
        expect(exports.values.has('defineCoreHandler')).toBe(true);
        expect(exports.values.has('MethodName')).toBe(true);
    });

    it('should classify interfaces and type aliases as types', () => {
        expect(exports.types.has('AppOptions')).toBe(true);
        expect(exports.types.has('IAppEvent')).toBe(true);
        expect(exports.values.has('AppOptions')).toBe(false);
        expect(exports.values.has('IAppEvent')).toBe(false);
    });

    it('should not list a name in both sets', () => {
        for (const name of exports.values) {
            expect(exports.types.has(name)).toBe(false);
        }
    });

    it('should reject an entry with an unresolved re-export', () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'routup-api-names-'));
        const entry = path.join(dir, 'index.ts');

        try {
            writeFileSync(entry, "export { missing } from './missing.ts';\n");

            expect(() => readExports(entry)).toThrow(/missing/);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('should reject an unresolved re-export in a nested barrel', () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'routup-api-names-'));
        const entry = path.join(dir, 'index.ts');

        try {
            writeFileSync(entry, "export * from './mid.ts';\n");
            writeFileSync(path.join(dir, 'mid.ts'), "export { missing } from './missing.ts';\nexport const ok = 1;\n");

            expect(() => readExports(entry)).toThrow(/missing/);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});

const pages = readdirSync(apiDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
        const markdown = readFileSync(path.join(apiDir, file), 'utf8');

        return {
            file,
            markdown,
            names: readDocumentedNames(markdown),
        };
    });

const documented = new Set(pages.flatMap((page) => page.names));

describe('docs/api-names: API pages', () => {
    it('should read names from the API pages', () => {
        expect(pages.map((page) => page.file)).toContain('app.md');
        expect(documented.size).toBeGreaterThan(0);
    });

    it('no heading hides a name behind other text', () => {
        const hidden = pages.flatMap(({ file, markdown }) => readHiddenNames(markdown)
            .map((heading) => `${file}: ${heading}`));

        expect(hidden, hidden.join('\n')).toEqual([]);
    });

    it('every documented name is exported', () => {
        const unknown: string[] = [];

        for (const { file, names } of pages) {
            for (const name of names) {
                if (
                    !exports.values.has(name) &&
                    !exports.types.has(name) &&
                    !ENTRY_ONLY.includes(name)
                ) {
                    unknown.push(`${file}: ${name}`);
                }
            }
        }

        expect(unknown, unknown.join('\n')).toEqual([]);
    });

    it('every runtime export is documented or exempt', () => {
        const missing = [...exports.values, ...ENTRY_ONLY]
            .filter((name) => !documented.has(name) && !(name in EXEMPT))
            .sort();

        expect(missing, missing.join('\n')).toEqual([]);
    });

    it('no exemption is stale', () => {
        const stale = Object.keys(EXEMPT)
            .filter((name) => !exports.values.has(name) || documented.has(name))
            .sort();

        expect(stale, stale.join('\n')).toEqual([]);
    });
});
