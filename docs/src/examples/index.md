# Examples

Complete apps for common tasks. Each page shows the full `app.ts`, which a test runs, and how to try it with `curl`.

<div class="examples-grid">
<RtCard href="/examples/rest-api">
<h3>REST API</h3>
<p>CRUD routes over an in-memory store, JSON bodies via <code>@routup/body</code>, 404 for unknown ids.</p>
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
