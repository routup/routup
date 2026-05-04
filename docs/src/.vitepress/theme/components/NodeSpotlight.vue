<script setup lang="ts">
const code = `// migrate.ts
import http from 'node:http';
import compression from 'compression';
import { Router, defineCoreHandler } from 'routup';
import { toNodeHandler, fromNodeHandler } from 'routup/node';

const router = new Router();

// 1. Wrap an Express/Connect middleware as a routup handler.
router.use(fromNodeHandler(compression()));

// 2. Add a return-based handler alongside it.
router.get('/health', defineCoreHandler(() => ({ ok: true })));

// 3. Mount the whole router inside a plain Node http.Server.
http.createServer(toNodeHandler(router)).listen(3000);`;
</script>

<template>
    <section class="rt-spot">
        <div class="rt-spot-inner">
            <div class="rt-spot-text">
                <p class="rt-spot-eyebrow">
                    routup/node
                </p>
                <h2 class="rt-spot-heading">
                    Drop in alongside Express.
                </h2>
                <p class="rt-spot-tagline">
                    Two helpers turn routup into an incremental migration. Wrap an existing
                    <code>compression()</code>, <code>cors()</code>, or <code>passport.authenticate()</code>
                    chain with <code>fromNodeHandler()</code>. Mount the router inside any
                    <code>http.Server</code> with <code>toNodeHandler()</code>.
                </p>
                <ul class="rt-spot-list">
                    <li><strong>fromNodeHandler()</strong> — wrap any (req, res, next) middleware as a routup handler</li>
                    <li><strong>toNodeHandler()</strong> — convert a Router to a Node-style (req, res) handler</li>
                    <li><strong>No rewrite</strong> — Express middleware keeps working while you port routes one at a time</li>
                    <li><strong>Same Router everywhere</strong> — the same routes ship to Bun, Deno, and Cloudflare unchanged</li>
                </ul>
                <a
                    class="rt-btn rt-btn-primary"
                    href="/guide/express-compatibility"
                >Read the migration guide →</a>
            </div>

            <div class="rt-spot-code">
                <div class="rt-spot-code-toolbar">
                    <span>migrate.ts</span>
                </div>
                <pre><code>{{ code }}</code></pre>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-spot {
    padding: 4rem 1.5rem;
    background: var(--rt-color-bg-muted);
}
.rt-spot-inner {
    max-width: 1152px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    align-items: center;
}
@media (min-width: 960px) {
    .rt-spot-inner { grid-template-columns: 1fr 1fr; gap: 4rem; }
}

.rt-spot-eyebrow {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--rt-color-primary-500);
    margin: 0 0 0.75rem;
    font-family: ui-monospace, monospace;
}

.rt-spot-heading {
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 1rem;
}

.rt-spot-tagline {
    font-size: 1.0625rem;
    line-height: 1.6;
    color: var(--rt-color-fg-muted);
    margin: 0 0 1.25rem;
}
.rt-spot-tagline code {
    background: var(--rt-color-bg-elevated);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.85em;
    font-family: ui-monospace, monospace;
}

.rt-spot-list {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
}
.rt-spot-list li {
    padding: 0.5rem 0;
    color: var(--rt-color-fg);
    font-size: 0.9375rem;
    border-bottom: 1px solid var(--rt-color-border-muted);
}
.rt-spot-list li:last-child { border-bottom: none; }
.rt-spot-list strong { color: var(--rt-color-primary-500); font-weight: 600; }

.rt-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none !important;
    transition: background-color 120ms;
}
.rt-btn-primary {
    background: var(--rt-color-primary-600);
    color: var(--rt-color-on-primary);
}
.rt-btn-primary:hover { background: var(--rt-color-primary-500); }

.rt-spot-code {
    border: 1px solid var(--rt-color-border);
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--rt-color-bg);
}
.rt-spot-code-toolbar {
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--rt-color-border);
    font-size: 0.75rem;
    color: var(--rt-color-fg-muted);
    font-family: ui-monospace, monospace;
    background: var(--rt-color-bg-elevated);
}
.rt-spot-code pre {
    margin: 0;
    padding: 1.25rem;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.65;
    color: var(--rt-color-fg);
}
.rt-spot-code code { font-family: ui-monospace, monospace; }
</style>
