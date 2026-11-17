import ts from 'typescript';

/**
 * Names documented on an API page that are not exports of `src/index.ts`
 * but of every runtime entry (`src/_entries/*.ts`).
 */
export const ENTRY_ONLY: string[] = ['serve', 'toNodeHandler'];

/**
 * Runtime exports that need no API entry, mapped to a one-line reason.
 */
export const EXEMPT: Record<string, string> = {};

const HEADING = /^(#{2,3})\s+`([A-Za-z_$][\w$]*)(?:\(\))?`\s*$/;
const FENCE = /^\s*(`{3,}|~{3,})/;

/**
 * Read the names of headings of level 2 or 3 whose text is exactly one
 * backticked identifier, optionally followed by `()`.
 * Headings inside fenced code blocks are ignored.
 */
export function readDocumentedNames(markdown: string): string[] {
    const names: string[] = [];
    let fence: string | undefined;

    for (const line of markdown.split(/\r?\n/)) {
        const fenceMatch = FENCE.exec(line);

        if (fenceMatch) {
            const marker = fenceMatch[1]!;

            if (typeof fence === 'undefined') {
                fence = marker;
            } else if (marker[0] === fence[0] && marker.length >= fence.length) {
                fence = undefined;
            }

            continue;
        }

        if (typeof fence !== 'undefined') {
            continue;
        }

        const match = HEADING.exec(line);

        if (match) {
            names.push(match[2]!);
        }
    }

    return names;
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
