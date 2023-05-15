export function isInstance(input: unknown, name: string) {
    return (
        typeof input === 'object' &&
        input !== null &&
        (input as { '@instanceof': symbol })['@instanceof'] === Symbol.for(name)
    );
}
