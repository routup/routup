import { isObject } from './object';

export function isInstance(input: unknown, name: string) {
    return (
        isObject(input) &&
        (input as { '@instanceof': symbol })['@instanceof'] === Symbol.for(name)
    );
}
