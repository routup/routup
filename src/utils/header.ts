export function sanitizeHeaderValue(value: string) : string {
    return value.replace(/[\r\n]/g, '');
}