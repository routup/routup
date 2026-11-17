import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ENTRY_ONLY, readDocumentedNames, readExports } from './api-names';

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
});

describe('docs/api-names: API pages', () => {
    it('every documented name is exported', () => {
        const unknown: string[] = [];
        const files = readdirSync(apiDir).filter((file) => file.endsWith('.md')).sort();

        for (const file of files) {
            const names = readDocumentedNames(readFileSync(path.join(apiDir, file), 'utf8'));

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
});
