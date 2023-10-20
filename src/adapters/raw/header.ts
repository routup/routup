import type { RawResponseHeader } from './type';

export function transformHeaderToTuples(key: string, value: RawResponseHeader) {
    const output : [string, string][] = [];

    if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
            output.push([key, value[j]]);
        }
    } else if (value !== undefined) {
        output.push([key, String(value)]);
    }

    return output;
}
export function transformHeadersToTuples(input: Record<string, RawResponseHeader>) {
    const output: [string, string][] = [];

    const keys = Object.keys(input);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i].toLowerCase();

        output.push(...transformHeaderToTuples(key, input[key]));
    }

    return output;
}
