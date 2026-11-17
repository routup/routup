import { readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * Runtime exports that need no API entry, mapped to a one-line reason.
 */
export const EXEMPT: Record<string, string> = {
    ErrorSymbol: 'Marker symbol of AppError; isError() checks it.',
    HandlerSymbol: 'Marker symbol of Handler; isHandler() checks it.',
    isPath: 'Path guard of App.use(); the same as typeof input === "string".',
    isWebHandler: 'Guard that is the same as typeof input === "function"; routup does not call it.',
    matchHandlerMethod: 'Method check of the match walk; routers and plugins do not need it.',
    normalizeAppOptions: 'Option normalization the App constructor runs.',
};

/**
 * Type exports that need no API entry and no mention on an API page,
 * mapped to a one-line reason.
 */
export const TYPE_EXEMPT: Record<string, string> = {
    EventStreamListener: 'No routup signature uses it.',
    NextFn: 'No routup signature uses it; IAppEvent documents next().',
    PluginInstallContext: 'Argument of the protected App.install(); no public signature uses it.',
};

const HEADING = /^ {0,3}(#{2,3})\s+`([A-Za-z_$][\w$]*)(?:\(\))?`\s*$/;
const HEADING_START = /^ {0,3}#{2,3}\s+`/;
const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/;

/**
 * Return the lines of a Markdown document outside fenced code blocks.
 * A fence closes on a line holding only a marker of the same character,
 * at least as long as the opening one.
 */
function readLinesOutsideFences(markdown: string): string[] {
    const lines: string[] = [];
    let fence: string | undefined;

    for (const line of markdown.split(/\r?\n/)) {
        if (typeof fence === 'undefined') {
            const open = FENCE_OPEN.exec(line);

            if (open) {
                fence = open[1]!;
            } else {
                lines.push(line);
            }

            continue;
        }

        const close = FENCE_CLOSE.exec(line);

        if (close && close[1]![0] === fence[0] && close[1]!.length >= fence.length) {
            fence = undefined;
        }
    }

    return lines;
}

/**
 * Read the names of headings of level 2 or 3, indented by up to three
 * spaces, whose text is exactly one backticked identifier, optionally
 * followed by `()`.
 * Headings inside fenced code blocks are ignored.
 */
export function readDocumentedNames(markdown: string): string[] {
    const names: string[] = [];

    for (const line of readLinesOutsideFences(markdown)) {
        const match = HEADING.exec(line);

        if (match) {
            names.push(match[2]!);
        }
    }

    return names;
}

/**
 * Read the headings of level 2 or 3 that start with a backticked span
 * but are not exactly one backticked identifier: a badge, an anchor,
 * other words or a generic after it. Such a heading would hide its
 * name from `readDocumentedNames`.
 */
export function readHiddenNames(markdown: string): string[] {
    return readLinesOutsideFences(markdown)
        .filter((line) => HEADING_START.test(line) && !HEADING.test(line));
}

const MENTION = /(?<!`)`([A-Za-z_$][\w$]*)(?:\(\)|<[^`]*>)?`(?!`)/g;

/**
 * Read the identifiers that appear as a backticked span outside fenced
 * code blocks, optionally followed by `()` or a generic argument list.
 * Each name is listed once, in order of first appearance.
 */
export function readMentionedNames(markdown: string): string[] {
    const names = new Set<string>();

    for (const line of readLinesOutsideFences(markdown)) {
        for (const match of line.matchAll(MENTION)) {
            names.add(match[1]!);
        }
    }

    return [...names];
}

const DECLARATION = /^\s*(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/;

/**
 * Read the names that a fenced code block declares as a type, an
 * interface, a class or an enum, so the block shows their shape.
 */
export function readDeclaredNames(markdown: string): string[] {
    const names = new Set<string>();
    let fence: string | undefined;

    for (const line of markdown.split(/\r?\n/)) {
        if (typeof fence === 'undefined') {
            const open = FENCE_OPEN.exec(line);

            if (open) {
                fence = open[1]!;
            }

            continue;
        }

        const close = FENCE_CLOSE.exec(line);

        if (close && close[1]![0] === fence[0] && close[1]!.length >= fence.length) {
            fence = undefined;

            continue;
        }

        const match = DECLARATION.exec(line);

        if (match) {
            names.add(match[1]!);
        }
    }

    return [...names];
}

function createProgram(rootNames: string[]): ts.Program {
    return ts.createProgram(rootNames, {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowImportingTsExtensions: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
    });
}

/**
 * Read the exports of a module with the TypeScript compiler API.
 * A symbol that resolves to a value (class, function, variable, enum)
 * is a value, everything else is a type.
 */
export function readExports(entryFile: string): { values: Set<string>; types: Set<string> } {
    return readProgramExports(createProgram([entryFile]), entryFile);
}

/**
 * Read the runtime exports that a runtime entry (`entriesDir/*.ts`) adds
 * to `indexFile`, sorted. One program holds all files, so the shared
 * modules are checked once.
 */
export function readEntryOnlyExports(entriesDir: string, indexFile: string): string[] {
    const entries = readdirSync(entriesDir)
        .filter((file) => file.endsWith('.ts'))
        .map((file) => path.join(entriesDir, file));
    const program = createProgram([indexFile, ...entries]);
    const base = readProgramExports(program, indexFile).values;
    const names = new Set<string>();

    for (const entry of entries) {
        for (const name of readProgramExports(program, entry).values) {
            if (!base.has(name)) {
                names.add(name);
            }
        }
    }

    return [...names].sort();
}

function readProgramExports(
    program: ts.Program,
    entryFile: string,
): { values: Set<string>; types: Set<string> } {
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(entryFile);

    if (!source) {
        throw new Error(`Cannot read ${entryFile}.`);
    }

    // An unresolved re-export resolves to the checker's unknown symbol,
    // which carries a value flag; refuse the entry instead of counting it.
    const diagnostics = ts.getPreEmitDiagnostics(program, source);

    if (diagnostics.length > 0) {
        const messages = diagnostics
            .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

        throw new Error(`${entryFile} has diagnostics:\n${messages.join('\n')}`);
    }

    const moduleSymbol = checker.getSymbolAtLocation(source);

    if (!moduleSymbol) {
        throw new Error(`${entryFile} is not a module.`);
    }

    const values = new Set<string>();
    const types = new Set<string>();
    const unresolved: string[] = [];

    for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
        const target = symbol.flags & ts.SymbolFlags.Alias ?
            checker.getAliasedSymbol(symbol) :
            symbol;

        // The checker's unknown symbol has no declarations. It stands for
        // a re-export that did not resolve, also inside a nested barrel
        // whose diagnostics the entry check above does not see.
        if (!target.declarations || target.declarations.length === 0) {
            unresolved.push(symbol.name);

            continue;
        }

        if (target.flags & ts.SymbolFlags.Value) {
            values.add(symbol.name);
        } else {
            types.add(symbol.name);
        }
    }

    if (unresolved.length > 0) {
        throw new Error(`${entryFile} re-exports unresolved names: ${unresolved.join(', ')}`);
    }

    return { values, types };
}
