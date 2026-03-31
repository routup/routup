import type { RawResponseHeader } from './type';

export function transformHeaderToTuples(key: string, value: RawResponseHeader) {
    const output : [string, string][] = [];

    if (Array.isArray(value)) {
        for (const element of value) {
            output.push([key, element]);
        }
    } else if (value !== undefined) {
        output.push([key, String(value)]);
    }

    return output;
}
export function transformHeadersToTuples(input: Record<string, RawResponseHeader>) {
    const output: [string, string][] = [];

    const keys = Object.keys(input);
    for (const key_ of keys) {
        const key = key_.toLowerCase();

        output.push(...transformHeaderToTuples(key, input[key]!));
    }

    return output;
}
