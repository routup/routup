<script setup lang="ts">
import { ref } from 'vue';

interface Tab {
    label: string;
    code: string;
}

const tabs: Tab[] = [
    {
        label: 'Install',
        code: 'npm install routup',
    },
    {
        label: 'Define',
        code: `// app.ts
import { App, defineCoreHandler } from 'routup';

export const app = new App();

app.get('/', defineCoreHandler(() => 'Hello, routup'));

app.get('/users/:id', defineCoreHandler((event) => ({
    id: Number(event.params.id),
})));

app.post('/users', defineCoreHandler(async (event) => {
    const body = await event.request.json();
    return { created: true, body };
}));`,
    },
    {
        label: 'Serve',
        code: `// server.ts
import { serve } from 'routup';
import { router } from './router';

serve(router, { port: 3000 });
// → Node, Bun, Deno, or Cloudflare — same line.`,
    },
];

const active = ref(0);
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const copy = async (code: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
        await navigator.clipboard.writeText(code);
    } catch {
        return;
    }
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copied.value = false; }, 1500);
};
</script>

<template>
    <section class="rt-codetabs">
        <div class="rt-codetabs-inner">
            <h2 class="rt-codetabs-heading">
                From zero to first request
            </h2>
            <p class="rt-codetabs-sub">
                Three steps. No decorators, no schema DSL, no per-runtime build target.
            </p>

            <div class="rt-codetabs-card">
                <div
                    class="rt-codetabs-tabs"
                    role="tablist"
                >
                    <button
                        v-for="(tab, i) in tabs"
                        :key="tab.label"
                        type="button"
                        class="rt-codetabs-tab"
                        :class="{ 'rt-codetabs-tab-active': active === i }"
                        :aria-selected="active === i"
                        role="tab"
                        @click="active = i"
                    >
                        {{ tab.label }}
                    </button>
                    <button
                        type="button"
                        class="rt-codetabs-copy"
                        @click="copy(tabs[active].code)"
                    >
                        {{ copied ? 'Copied' : 'Copy' }}
                    </button>
                </div>
                <pre class="rt-codetabs-pre"><code>{{ tabs[active].code }}</code></pre>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-codetabs {
    padding: 4rem 1.5rem;
    background: var(--rt-color-bg);
}

.rt-codetabs-inner {
    max-width: 960px;
    margin: 0 auto;
}

.rt-codetabs-heading {
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-align: center;
    margin: 0 0 0.5rem;
}

.rt-codetabs-sub {
    text-align: center;
    color: var(--rt-color-fg-muted);
    margin: 0 0 2rem;
}

.rt-codetabs-card {
    border: 1px solid var(--rt-color-border);
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--rt-color-bg);
}

.rt-codetabs-tabs {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.5rem 0;
    border-bottom: 1px solid var(--rt-color-border);
    background: var(--rt-color-bg-elevated);
}

.rt-codetabs-tab {
    padding: 0.5rem 0.875rem;
    border: none;
    background: transparent;
    color: var(--rt-color-fg-muted);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem 0.375rem 0 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
}
.rt-codetabs-tab:hover { color: var(--rt-color-fg); }
.rt-codetabs-tab-active {
    color: var(--rt-color-fg);
    border-bottom-color: var(--rt-color-primary-500);
    background: var(--rt-color-bg);
}

.rt-codetabs-copy {
    margin-left: auto;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--rt-color-border);
    border-radius: 0.375rem;
    background: transparent;
    font-size: 0.75rem;
    color: var(--rt-color-fg-muted);
    cursor: pointer;
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;
}
.rt-codetabs-copy:hover { color: var(--rt-color-fg); }

.rt-codetabs-pre {
    padding: 1.25rem;
    margin: 0;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.6;
    background: var(--rt-color-bg);
    color: var(--rt-color-fg);
}
.rt-codetabs-pre code { font-family: ui-monospace, monospace; }
</style>
