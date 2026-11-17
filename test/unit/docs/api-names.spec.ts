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
    EXEMPT,
    TYPE_EXEMPT,
    readDeclaredNames,
    readDocumentedNames,
    readEntryOnlyExports,
    readExports,
    readHiddenNames,
    readMentionedNames,
} from './api-names';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const apiDir = path.join(rootDir, 'docs', 'src', 'api');

// Building a TypeScript program takes a few seconds; build each once per file.
const indexFile = path.join(rootDir, 'src', 'index.ts');
const exports = readExports(indexFile);
const entryOnly = readEntryOnlyExports(path.join(rootDir, 'src', '_entries'), indexFile);

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

describe('docs/api-names: readMentionedNames', () => {
    it('should pick backticked identifiers in text, headings and tables', () => {
        const markdown = [
            '## `App`',
            '',
            'Pass a `Plugin` to `app.use()`.',
            '',
            '| `PluginInstallFn` | `(app: IApp) => void` |',
        ].join('\n');

        expect(readMentionedNames(markdown)).toEqual(['App', 'Plugin', 'PluginInstallFn']);
    });

    it('should accept a call suffix or a generic argument list', () => {
        expect(readMentionedNames('`createError()` and `IRouter<T>`')).toEqual(['createError', 'IRouter']);
    });

    it('should list a name once', () => {
        expect(readMentionedNames('`App` and `App`')).toEqual(['App']);
    });

    it('should ignore spans that are not one identifier', () => {
        expect(readMentionedNames('`app.use()` `a | b` `x = 1` ``App``')).toEqual([]);
    });

    it('should ignore names inside code fences', () => {
        expect(readMentionedNames('```ts\n`App`\n```\n\n`Plugin`')).toEqual(['Plugin']);
    });
});

describe('docs/api-names: readDeclaredNames', () => {
    it('should pick types, interfaces, classes and enums declared in a fence', () => {
        const markdown = [
            '```ts',
            'type CoreHandler = (event: IAppEvent) => unknown;',
            'interface WebHandler {',
            '    fetch(request: Request): Response;',
            '}',
            'declare class App implements IApp {}',
            'export enum HandlerType {}',
            'declare function defineCoreHandler(input: CoreHandler): Handler;',
            '```',
        ].join('\n');

        expect(readDeclaredNames(markdown)).toEqual(['CoreHandler', 'WebHandler', 'App', 'HandlerType']);
    });

    it('should ignore declarations outside fences', () => {
        expect(readDeclaredNames('type Outside = string;\n\n```ts\ntype Inside = string;\n```')).toEqual(['Inside']);
    });
});

describe('docs/api-names: readEntryOnlyExports', () => {
    it('should list the runtime exports the entries add to the index', () => {
        expect(entryOnly).toEqual(['serve', 'toNodeHandler']);
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
const mentioned = new Set(pages.flatMap((page) => [
    ...readMentionedNames(page.markdown),
    ...readDeclaredNames(page.markdown),
]));

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
                    !entryOnly.includes(name)
                ) {
                    unknown.push(`${file}: ${name}`);
                }
            }
        }

        expect(unknown, unknown.join('\n')).toEqual([]);
    });

    it('every runtime export is documented or exempt', () => {
        const missing = [...exports.values, ...entryOnly]
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

    it('every type export is documented, mentioned, declared or exempt', () => {
        const missing = [...exports.types]
            .filter((name) => !documented.has(name) && !mentioned.has(name) && !(name in TYPE_EXEMPT))
            .sort();

        expect(missing, missing.join('\n')).toEqual([]);
    });

    it('no type exemption is stale', () => {
        const stale = Object.keys(TYPE_EXEMPT)
            .filter((name) => !exports.types.has(name) || documented.has(name) || mentioned.has(name))
            .sort();

        expect(stale, stale.join('\n')).toEqual([]);
    });
});
