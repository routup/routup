import { isObject } from './object';

export function isInstance(
    input: unknown,
    sym: symbol,
) {
    if (!isObject(input)) {
        return false;
    }

    return (input as { '@instanceof': symbol })['@instanceof'] === sym;
}
