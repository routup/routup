import type { MethodName } from '../constants.ts';

export function toMethodName(input: string | undefined) : MethodName | undefined;
export function toMethodName(input: string | undefined, alt: MethodName) : MethodName;
export function toMethodName(
    input?: string,
    alt?: MethodName,
) : MethodName | undefined {
    if (input) {
        return input.toUpperCase() as MethodName;
    }

    return alt;
}
