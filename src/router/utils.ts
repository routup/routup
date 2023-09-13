let nextId = 0;
export function generateRouterID(): number {
    return ++nextId;
}
