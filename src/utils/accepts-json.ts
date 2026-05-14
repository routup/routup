/**
 * Check if the request accepts JSON responses.
 *
 * Parses the `Accept` header per RFC 7231 (media ranges + quality
 * params) rather than substring-matching, so:
 * - `application/json-seq` does NOT count as accepting `application/json`
 * - `application/json;q=0` is treated as an explicit rejection
 *
 * Returns true if no Accept header is present (API-first default).
 */
export function acceptsJson(request: Request): boolean {
    const accept = request.headers.get('accept');
    if (!accept) {
        return true;
    }

    return accept
        .toLowerCase()
        .split(',')
        .some((entry) => {
            const parts = entry.split(';').map((part) => part.trim());
            const mediaRange = parts[0]!;
            const qParam = parts.slice(1).find((param) => param.startsWith('q='));
            const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
            if (!Number.isFinite(q) || q <= 0) {
                return false;
            }

            return mediaRange === '*/*' ||
                mediaRange === 'application/*' ||
                mediaRange === 'application/json' ||
                mediaRange.endsWith('+json');
        });
}
