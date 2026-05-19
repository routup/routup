export function isObject(item: unknown) : item is Record<string, any> {
    return (
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    );
}
