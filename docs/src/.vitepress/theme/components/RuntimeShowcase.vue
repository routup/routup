<script setup lang="ts">
interface RuntimeCard {
    name: string;
    accent: string;
    href: string;
    entry: string;
    summary: string;
    bullets: string[];
}

const runtimes: RuntimeCard[] = [
    {
        name: 'Node.js',
        accent: '#10b981',
        href: '/guide/runtime-environments',
        entry: "import { serve, toNodeHandler } from 'routup/node'",
        summary: 'srvx Node adapter plus a toNodeHandler() bridge for Express/Connect-style middleware stacks.',
        bullets: [
            'Native http.Server interop',
            'fromNodeHandler() for legacy middleware',
            'Streaming bodies via Node duplex',
        ],
    },
    {
        name: 'Bun',
        accent: '#fbbf24',
        href: '/guide/runtime-environments',
        entry: "import { serve } from 'routup/bun'",
        summary: 'Bun.serve() under the hood — start in milliseconds, single binary, no transpile step.',
        bullets: [
            'Bun.serve() integration',
            'Zero build, TypeScript native',
            'Web Standards request handling',
        ],
    },
    {
        name: 'Deno',
        accent: '#06b6d4',
        href: '/guide/runtime-environments',
        entry: "import { serve } from 'routup/deno'",
        summary: 'Deno.serve() with permission boundaries and built-in TypeScript — same App, same handlers.',
        bullets: [
            'Deno.serve() integration',
            'Permission-scoped IO',
            'Works with import maps',
        ],
    },
    {
        name: 'Cloudflare Workers',
        accent: '#f97316',
        href: '/guide/runtime-environments',
        entry: "import { App } from 'routup/cloudflare'",
        summary: 'Edge-deployable. Export app.fetch as the Worker entry — no server, no cold start.',
        bullets: [
            'Worker fetch handler',
            'Sub-1ms cold start',
            'Pairs with Pages / Durable Objects',
        ],
    },
    {
        name: 'Generic / Fetch',
        accent: '#8b5cf6',
        href: '/guide/runtime-environments',
        entry: "import { App } from 'routup/generic'",
        summary: 'Any host that speaks Web Standards. Wire app.fetch to whatever provides Request and Response.',
        bullets: [
            'Pure Fetch interface',
            'Vercel Edge / Netlify Edge',
            'Service Worker compatible',
        ],
    },
];
</script>

<template>
    <section class="rt-runtimes">
        <div class="rt-runtimes-inner">
            <h2 class="rt-runtimes-heading">
                Pick your runtime
            </h2>
            <p class="rt-runtimes-sub">
                One App, six entry points. Conditional exports route the import to the adapter that
                matches the current runtime — no plugin, no platform branch in your code.
            </p>

            <div class="rt-runtimes-grid">
                <a
                    v-for="r in runtimes"
                    :key="r.name"
                    :href="r.href"
                    class="rt-runtime-card"
                    :style="{ '--accent': r.accent }"
                >
                    <h3 class="rt-runtime-name">
                        {{ r.name }}
                    </h3>
                    <code class="rt-runtime-entry">{{ r.entry }}</code>
                    <p class="rt-runtime-summary">{{ r.summary }}</p>
                    <ul class="rt-runtime-list">
                        <li
                            v-for="b in r.bullets"
                            :key="b"
                        >{{ b }}</li>
                    </ul>
                    <span class="rt-runtime-cta">Read more →</span>
                </a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-runtimes {
    padding: 4rem 1.5rem;
    background: var(--rt-color-bg-muted);
}

.rt-runtimes-inner {
    max-width: 1152px;
    margin: 0 auto;
}

.rt-runtimes-heading {
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-align: center;
    margin: 0 0 0.75rem;
}

.rt-runtimes-sub {
    text-align: center;
    max-width: 40rem;
    margin: 0 auto 2.5rem;
    color: var(--rt-color-fg-muted);
    line-height: 1.6;
}

.rt-runtimes-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
}

@media (min-width: 640px) { .rt-runtimes-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px) { .rt-runtimes-grid { grid-template-columns: repeat(3, 1fr); } }

.rt-runtime-card {
    --accent: var(--rt-color-primary-500);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border: 1px solid var(--rt-color-border);
    border-top: 3px solid var(--accent);
    border-radius: 0.75rem;
    background: var(--rt-color-bg);
    text-decoration: none !important;
    color: inherit;
    transition: transform 120ms, border-color 120ms;
}
.rt-runtime-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
}

.rt-runtime-name {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}

.rt-runtime-entry {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    background: var(--rt-color-bg-elevated);
    color: var(--rt-color-fg);
    border-radius: 0.375rem;
    padding: 0.375rem 0.625rem;
    margin: 0 0 0.875rem;
    word-break: break-all;
}

.rt-runtime-summary {
    font-size: 0.9375rem;
    color: var(--rt-color-fg-muted);
    margin: 0 0 1rem;
    line-height: 1.5;
}

.rt-runtime-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.25rem;
    flex: 1;
}
.rt-runtime-list li {
    padding: 0.375rem 0;
    font-size: 0.875rem;
    color: var(--rt-color-fg);
    border-bottom: 1px solid var(--rt-color-border-muted);
}
.rt-runtime-list li:last-child { border-bottom: none; }
.rt-runtime-list li::before {
    content: '✓';
    margin-right: 0.5rem;
    color: var(--accent);
    font-weight: 700;
}

.rt-runtime-cta {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--accent);
}
</style>
