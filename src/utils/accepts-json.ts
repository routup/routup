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
            // Split each parameter on `=` and trim both halves so
            // `q=0`, `q = 0`, and `q =0` are all recognized as q=0.
            const qParam = parts.slice(1)
                .map((param) => param.split('=').map((s) => s.trim()))
                .find(([key]) => key === 'q');
            const q = qParam ? Number.parseFloat(qParam[1] ?? '') : 1;
            if (!Number.isFinite(q) || q <= 0) {
                return false;
            }

            return mediaRange === '*/*' ||
                mediaRange === 'application/*' ||
                mediaRange === 'application/json' ||
                mediaRange.endsWith('+json');
        });
}
