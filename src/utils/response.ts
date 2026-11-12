import { FastResponse } from 'srvx';

/**
 * Build a response with srvx's `FastResponse`, which on Node.js skips
 * the Web `Response` machinery and is written straight to the socket.
 *
 * `FastResponse` does not validate its init on Node.js, while the global
 * `Response` (and `FastResponse` on every other runtime) does. An init
 * the platform would reject — a status outside 200..599, or a body with
 * a null-body status — is handed to the global `Response` instead, so
 * the platform's own error is thrown on every runtime and reaches the
 * pipeline's error handling.
 */
export function createFastResponse(
    body: BodyInit | null,
    status: number,
    headers: HeadersInit,
): Response {
    // Written so that NaN fails the range check.
    if (
        !(status >= 200 && status <= 599) ||
        (body !== null && (status === 204 || status === 205 || status === 304))
    ) {
        return new Response(body, { status, headers });
    }

    return new FastResponse(body, { status, headers });
}
