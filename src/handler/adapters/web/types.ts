/**
 * A plain function that follows the Web Fetch API signature.
 * Compatible with any framework that exposes a fetch-style entry point.
 */
export interface WebHandler {
    (request: Request): Response | Promise<Response>;
}

/**
 * An object with a `fetch` method (e.g. another router, Hono app, etc.).
 */
export interface WebHandlerProvider {
    fetch(request: Request): Response | Promise<Response>;
}
