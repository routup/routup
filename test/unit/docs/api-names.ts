import ts from 'typescript';

/**
 * Names documented on an API page that are not exports of `src/index.ts`
 * but of every runtime entry (`src/_entries/*.ts`).
 */
export const ENTRY_ONLY: string[] = ['serve', 'toNodeHandler'];

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

const HEADING = /^(#{2,3})\s+`([A-Za-z_$][\w$]*)(?:\(\))?`\s*$/;
const HEADING_START = /^#{2,3}\s+`[A-Za-z_$][\w$]*(?:\(\))?`/;
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
 * Read the names of headings of level 2 or 3 whose text is exactly one
 * backticked identifier, optionally followed by `()`.
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
 * Read the headings of level 2 or 3 that start with a backticked
 * identifier but have other text after it (a badge, an anchor, words).
 * Such a heading would hide its name from `readDocumentedNames`.
 */
export function readHiddenNames(markdown: string): string[] {
    return readLinesOutsideFences(markdown)
        .filter((line) => HEADING_START.test(line) && !HEADING.test(line));
}

/**
 * Read the exports of a module with the TypeScript compiler API.
 * A symbol that resolves to a value (class, function, variable, enum)
 * is a value, everything else is a type.
 */
export function readExports(entryFile: string): { values: Set<string>; types: Set<string> } {
    const program = ts.createProgram([entryFile], {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowImportingTsExtensions: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
    });
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

    for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
        const target = symbol.flags & ts.SymbolFlags.Alias ?
            checker.getAliasedSymbol(symbol) :
            symbol;

        if (target.flags & ts.SymbolFlags.Value) {
            values.add(symbol.name);
        } else {
            types.add(symbol.name);
        }
    }

    return { values, types };
}
