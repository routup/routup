# Examples

Complete apps for common tasks. Each page shows the full `app.ts`, which a test runs, and how to try it with `curl`.

<div class="examples-grid">
<RtCard href="/examples/rest-api">
<h3>REST API</h3>
<p>CRUD routes over an in-memory store, JSON bodies via <code>@routup/body</code>, 404 for unknown ids.</p>
</RtCard>
<RtCard href="/examples/auth-middleware">
<h3>Auth Middleware</h3>
<p>Bearer token check, the user handed on through <code>event.store</code>, 401 otherwise.</p>
</RtCard>
<RtCard href="/examples/json-errors">
<h3>JSON Errors</h3>
<p>One error handler that answers every thrown error with a JSON body and its status.</p>
</RtCard>
<RtCard href="/examples/server-sent-events">
<h3>Server-Sent Events</h3>
<p>Three events streamed with <code>createEventStream</code>, then the stream closes.</p>
</RtCard>
<RtCard href="/examples/modular-apps">
<h3>Modular Apps</h3>
<p>One App per resource, mounted on a root App under a path prefix.</p>
</RtCard>
<RtCard href="/examples/static-files">
<h3>Static Files</h3>
<p>A single-page app served with <code>@routup/assets</code>, <code>index.html</code> as fallback, <code>/api</code> left to the routes.</p>
</RtCard>
<RtCard href="/examples/express-middleware">
<h3>Express Middleware</h3>
<p>A Node.js <code>(req, res, next)</code> middleware wrapped with <code>fromNodeMiddleware</code>.</p>
</RtCard>
<RtCard href="/examples/cloudflare-workers">
<h3>Cloudflare Workers</h3>
<p>The app as a module worker, with its <code>wrangler.jsonc</code>.</p>
</RtCard>
</div>

<style>
.examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    margin-top: 24px;
}
</style>
