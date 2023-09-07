/**
 * Based on https://github.com/unjs/pathe v1.1.1 (055f50a6f1131f4e5c56cf259dd8816168fba329)
 */

function normalizeWindowsPath(input = '') {
    if (!input || !input.includes('\\')) {
        return input;
    }

    return input.replace(/\\/g, '/');
}

const EXTNAME_RE = /.(\.[^./]+)$/;
export function extname(input: string) {
    const match = EXTNAME_RE.exec(normalizeWindowsPath(input));
    return (match && match[1]) || '';
}

export function basename(input: string, extension? :string) {
    const lastSegment = normalizeWindowsPath(input)
        .split('/')
        .pop();

    if (!lastSegment) {
        return input;
    }

    return extension && lastSegment.endsWith(extension) ?
        lastSegment.slice(0, -extension.length) :
        lastSegment;
}
