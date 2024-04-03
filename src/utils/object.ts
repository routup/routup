export function isObject(item: unknown) : item is Record<string, any> {
    return (
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    );
}

export function setProperty(
    record: Record<PropertyKey, any>,
    property: PropertyKey,
    value: any,
): void {
    (record as any)[property] = value;
}

export function getProperty<T = any>(
    req: Record<PropertyKey, any>,
    property: PropertyKey,
): T {
    return (req as any)[property];
}
