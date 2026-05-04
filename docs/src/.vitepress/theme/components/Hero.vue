<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useData } from 'vitepress';
import { Router, defineCoreHandler, type IRoutupEvent } from 'routup';

const { isDark } = useData();

interface RouteSpec {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    pattern: string;
    label: string;
    handle: (event: IRoutupEvent) => unknown | Promise<unknown>;
}

const specs: RouteSpec[] = [
    {
        method: 'GET',
        pattern: '/users',
        label: 'list users',
        handle: () => [
            { id: 1, name: 'Ada' },
            { id: 2, name: 'Linus' },
        ],
    },
    {
        method: 'GET',
        pattern: '/users/:id',
        label: 'show user',
        handle: (event) => ({
            id: Number(event.params.id),
            name: event.params.id === '1' ? 'Ada' : 'Linus',
        }),
    },
    {
        method: 'POST',
        pattern: '/users',
        label: 'create user',
        handle: (event) => {
            event.response.status = 201;
            return 'Created';
        },
    },
    {
        method: 'GET',
        pattern: '/files/*splat',
        label: 'serve file',
        handle: (event) => `binary stream → ${event.params.splat ?? ''}`,
    },
];

const lastMatchedSpec = shallowRef<RouteSpec | null>(null);

const router = new Router();
for (const spec of specs) {
    const method = spec.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    router[method](spec.pattern, defineCoreHandler((event) => {
        lastMatchedSpec.value = spec;
        return spec.handle(event);
    }));
}

const form = reactive({
    method: 'GET' as RouteSpec['method'],
    path: '/users/1',
});

interface DispatchResult {
    matchedIndex: number;
    params: Record<string, string>;
    status: number;
    contentType: string;
    body: string;
    notFound: boolean;
}

const dispatch = ref<DispatchResult>({
    matchedIndex: -1,
    params: {},
    status: 200,
    contentType: '',
    body: '',
    notFound: false,
});

const pending = ref(false);
const ready = ref(false);

async function runDispatch() {
    if (!form.path) return;
    pending.value = true;
    lastMatchedSpec.value = null;
    try {
        const url = new URL(form.path, 'http://localhost');
        const request = new Request(url, { method: form.method });
        const response = await router.fetch(request);
        const matchedIndex = lastMatchedSpec.value
            ? specs.indexOf(lastMatchedSpec.value)
            : -1;
        const params: Record<string, string> = {};
        if (matchedIndex !== -1) {
            for (const [k, v] of extractParams(specs[matchedIndex].pattern, url.pathname)) {
                params[k] = v;
            }
        }
        const contentType = response.headers.get('content-type') ?? '';
        const text = await response.text();
        dispatch.value = {
            matchedIndex,
            params,
            status: response.status,
            contentType,
            body: prettify(text, contentType),
            notFound: matchedIndex === -1,
        };
    } finally {
        pending.value = false;
        ready.value = true;
    }
}

function extractParams(pattern: string, path: string): Array<[string, string]> {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    const result: Array<[string, string]> = [];
    for (let i = 0; i < patternParts.length; i++) {
        const seg = patternParts[i];
        if (seg.startsWith('*')) {
            result.push([seg.slice(1), pathParts.slice(i).join('/')]);
            return result;
        }
        if (seg.startsWith(':')) {
            result.push([seg.slice(1), pathParts[i] ?? '']);
        }
    }
    return result;
}

function prettify(text: string, contentType: string): string {
    if (contentType.includes('application/json')) {
        try {
            return JSON.stringify(JSON.parse(text), null, 2);
        } catch {
            return text;
        }
    }
    return text;
}

onMounted(() => {
    void runDispatch();
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleDispatch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { void runDispatch(); }, 60);
}

const paramEntries = computed(() => Object.entries(dispatch.value.params));

const presets: Array<{ method: RouteSpec['method']; path: string }> = [
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/users/2' },
    { method: 'POST', path: '/users' },
    { method: 'GET', path: '/files/avatars/peter.png' },
    { method: 'GET', path: '/missing' },
];

const applyPreset = (preset: { method: RouteSpec['method']; path: string }) => {
    form.method = preset.method;
    form.path = preset.path;
    scheduleDispatch();
};

const toggleDark = () => {
    isDark.value = !isDark.value;
};

const methodColor = (method: string) => {
    switch (method) {
        case 'GET': return 'var(--rt-method-get)';
        case 'POST': return 'var(--rt-method-post)';
        case 'PUT': return 'var(--rt-method-put)';
        case 'PATCH': return 'var(--rt-method-patch)';
        case 'DELETE': return 'var(--rt-method-delete)';
        default: return 'var(--rt-color-fg-muted)';
    }
};

const codePreview = ref(`import { Router, defineCoreHandler, serve } from 'routup';

const router = new Router();

router.get('/users/:id', defineCoreHandler(
    (event) => ({ id: Number(event.params.id) })
));

serve(router, { port: 3000 });`);
</script>

<template>
    <section class="rt-hero">
        <div class="rt-hero-inner">
            <div class="rt-hero-text">
                <h1 class="rt-hero-title">
                    <span class="rt-hero-title-grad">routup</span>
                </h1>
                <p class="rt-hero-tagline">
                    A minimalistic, runtime-agnostic HTTP router.
                    Return-based handlers, Web&nbsp;Standards everywhere — Node, Bun, Deno, Cloudflare,
                    or any Fetch-ready runtime.
                </p>
                <div class="rt-hero-actions">
                    <a
                        class="rt-btn rt-btn-primary"
                        href="/guide/"
                    >Get Started</a>
                    <a
                        class="rt-btn rt-btn-ghost"
                        href="https://github.com/routup/routup"
                        target="_blank"
                        rel="noopener"
                    >View on GitHub</a>
                </div>
                <p class="rt-hero-meta">
                    MIT licensed · Node 22+ · ESM-only · TypeScript-first
                </p>
                <pre class="rt-hero-snippet"><code>{{ codePreview }}</code></pre>
            </div>

            <div class="rt-hero-card">
                <div class="rt-hero-card-toolbar">
                    <span
                        class="rt-hero-card-dot"
                        style="background: var(--rt-color-error-500)"
                    />
                    <span
                        class="rt-hero-card-dot"
                        style="background: var(--rt-color-warning-500)"
                    />
                    <span
                        class="rt-hero-card-dot"
                        style="background: var(--rt-color-success-500)"
                    />
                    <span class="rt-hero-card-title">router.fetch(request)</span>
                    <button
                        class="rt-hero-card-toggle"
                        type="button"
                        @click="toggleDark"
                    >
                        {{ isDark ? 'Dark' : 'Light' }}
                    </button>
                </div>

                <div class="rt-hero-card-body">
                    <p class="rt-hero-card-label">
                        Registered routes
                    </p>
                    <ul class="rt-hero-routes">
                        <li
                            v-for="(route, i) in specs"
                            :key="route.method + route.pattern"
                            class="rt-hero-route"
                            :class="{ 'rt-hero-route-active': dispatch.matchedIndex === i }"
                        >
                            <span
                                class="rt-hero-method"
                                :style="{ color: methodColor(route.method) }"
                            >{{ route.method }}</span>
                            <code class="rt-hero-pattern">{{ route.pattern }}</code>
                            <span class="rt-hero-route-label">{{ route.label }}</span>
                        </li>
                    </ul>

                    <p class="rt-hero-card-label">
                        Send a request
                    </p>
                    <div class="rt-hero-form">
                        <select
                            v-model="form.method"
                            class="rt-hero-select"
                            :style="{ color: methodColor(form.method) }"
                            @change="scheduleDispatch"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                        <input
                            v-model="form.path"
                            class="rt-hero-input"
                            placeholder="/users/1"
                            spellcheck="false"
                            @input="scheduleDispatch"
                        >
                    </div>
                    <div class="rt-hero-presets">
                        <button
                            v-for="preset in presets"
                            :key="preset.method + preset.path"
                            type="button"
                            class="rt-hero-preset"
                            @click="applyPreset(preset)"
                        >
                            <span :style="{ color: methodColor(preset.method) }">{{ preset.method }}</span>
                            {{ preset.path }}
                        </button>
                    </div>

                    <div
                        class="rt-hero-output"
                        :class="{ 'rt-hero-output-miss': ready && dispatch.notFound }"
                    >
                        <div class="rt-hero-output-head">
                            <span
                                v-if="ready"
                                class="rt-hero-status"
                                :class="dispatch.notFound ? 'rt-hero-status-err' : 'rt-hero-status-ok'"
                            >
                                {{ dispatch.status }}
                                {{ dispatch.notFound ? 'Not Found' : 'OK' }}
                            </span>
                            <span
                                v-else
                                class="rt-hero-status"
                            >…</span>
                            <span
                                v-if="ready && !dispatch.notFound && dispatch.contentType"
                                class="rt-hero-content-type"
                            >{{ dispatch.contentType }}</span>
                            <span class="rt-hero-output-hint">{{ pending ? 'dispatching' : 'live' }}</span>
                        </div>
                        <template v-if="ready && !dispatch.notFound">
                            <dl
                                v-if="paramEntries.length"
                                class="rt-hero-params"
                            >
                                <template
                                    v-for="[key, value] in paramEntries"
                                    :key="key"
                                >
                                    <dt>params.{{ key }}</dt>
                                    <dd>{{ value }}</dd>
                                </template>
                            </dl>
                            <pre class="rt-hero-output-pre"><code>{{ dispatch.body }}</code></pre>
                        </template>
                        <p
                            v-else-if="ready"
                            class="rt-hero-output-empty"
                        >
                            No route matched. Routup walks the stack and falls through to the default
                            <code>404</code>.
                        </p>
                        <p
                            v-else
                            class="rt-hero-output-empty"
                        >
                            Booting <code>router.fetch()</code>…
                        </p>
                    </div>

                    <p class="rt-hero-card-hint">
                        Each keystroke re-runs <code>router.fetch()</code> against a real
                        <code>Request</code>. Same model that ships to Node, Bun, Deno, and
                        Cloudflare Workers.
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-hero {
    padding: 4rem 1.5rem 3rem;
    background:
        radial-gradient(1200px 600px at 100% 0%, color-mix(in oklab, var(--rt-color-primary-500) 14%, transparent), transparent),
        radial-gradient(800px 400px at 0% 100%, color-mix(in oklab, var(--rt-color-accent-500) 12%, transparent), transparent);
}

.rt-hero-inner {
    max-width: 1152px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    align-items: start;
}

@media (min-width: 960px) {
    .rt-hero-inner { grid-template-columns: 1fr 1fr; gap: 4rem; }
}

.rt-hero-title {
    font-size: clamp(2.75rem, 6vw, 4.5rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0 0 1.25rem;
}
.rt-hero-title-grad {
    background: linear-gradient(120deg, var(--rt-color-primary-500), var(--rt-color-accent-500));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.rt-hero-tagline {
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--rt-color-fg-muted);
    max-width: 36rem;
    margin: 0 0 2rem;
}

.rt-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
}

.rt-hero-meta {
    margin: 0 0 1.5rem;
    font-size: 0.8125rem;
    color: var(--rt-color-fg-muted);
}

.rt-hero-snippet {
    margin: 0;
    padding: 1rem 1.25rem;
    border: 1px solid var(--rt-color-border);
    border-radius: 0.75rem;
    background: var(--rt-color-bg-elevated);
    font-size: 0.8125rem;
    line-height: 1.55;
    color: var(--rt-color-fg);
    font-family: ui-monospace, monospace;
    overflow-x: auto;
}

.rt-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    border: 1px solid transparent;
    transition: background-color 120ms, color 120ms, border-color 120ms;
    cursor: pointer;
    text-decoration: none !important;
}

.rt-btn-primary {
    background: var(--rt-color-primary-600);
    color: var(--rt-color-on-primary);
}
.rt-btn-primary:hover { background: var(--rt-color-primary-500); }

.rt-btn-ghost {
    background: transparent;
    color: var(--rt-color-fg);
    border-color: var(--rt-color-border);
}
.rt-btn-ghost:hover {
    background: var(--rt-color-bg-elevated);
    border-color: var(--rt-color-fg-muted);
}

.rt-hero-card {
    border: 1px solid var(--rt-color-border);
    border-radius: 1rem;
    background: var(--rt-color-bg);
    box-shadow: 0 25px 50px -12px color-mix(in oklab, var(--rt-color-primary-500) 14%, rgba(0,0,0,0.25));
    overflow: hidden;
}

.rt-hero-card-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--rt-color-border);
    background: var(--rt-color-bg-elevated);
}
.rt-hero-card-dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 999px;
    display: inline-block;
}
.rt-hero-card-title {
    font-size: 0.75rem;
    color: var(--rt-color-fg-muted);
    font-family: ui-monospace, monospace;
    margin-left: 0.5rem;
}
.rt-hero-card-toggle {
    margin-left: auto;
    font-size: 0.75rem;
    padding: 0.25rem 0.625rem;
    border: 1px solid var(--rt-color-border);
    border-radius: 999px;
    background: transparent;
    color: var(--rt-color-fg-muted);
    cursor: pointer;
}
.rt-hero-card-toggle:hover { color: var(--rt-color-fg); }

.rt-hero-card-body { padding: 1.25rem; }

.rt-hero-card-label {
    margin: 0 0 0.5rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    color: var(--rt-color-fg-muted);
}
.rt-hero-card-label + .rt-hero-form,
.rt-hero-card-label + .rt-hero-routes {
    margin-bottom: 1rem;
}

.rt-hero-routes {
    list-style: none;
    padding: 0;
    margin: 0 0 1.25rem;
    border: 1px solid var(--rt-color-border);
    border-radius: 0.5rem;
    overflow: hidden;
    background: var(--rt-color-bg-muted);
}
.rt-hero-route {
    display: grid;
    grid-template-columns: 4rem 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--rt-color-border-muted);
    font-size: 0.8125rem;
    transition: background-color 120ms;
}
.rt-hero-route:last-child { border-bottom: none; }
.rt-hero-route-active {
    background: color-mix(in oklab, var(--rt-color-primary-500) 14%, transparent);
}
.rt-hero-method {
    font-family: ui-monospace, monospace;
    font-weight: 700;
    font-size: 0.75rem;
}
.rt-hero-pattern {
    font-family: ui-monospace, monospace;
    color: var(--rt-color-fg);
    background: transparent;
    padding: 0;
}
.rt-hero-route-label {
    font-size: 0.75rem;
    color: var(--rt-color-fg-muted);
    text-align: right;
}

.rt-hero-form {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.rt-hero-select {
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--rt-color-border);
    background: var(--rt-color-bg);
    font-family: ui-monospace, monospace;
    font-weight: 700;
    font-size: 0.8125rem;
    cursor: pointer;
}

.rt-hero-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--rt-color-border);
    background: var(--rt-color-bg);
    color: var(--rt-color-fg);
    font-size: 0.875rem;
    font-family: ui-monospace, monospace;
    transition: border-color 120ms;
}
.rt-hero-input:focus {
    outline: none;
    border-color: var(--rt-color-primary-500);
}

.rt-hero-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 1.25rem;
}
.rt-hero-preset {
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    border: 1px solid var(--rt-color-border);
    background: var(--rt-color-bg);
    font-family: ui-monospace, monospace;
    font-size: 0.7rem;
    color: var(--rt-color-fg-muted);
    cursor: pointer;
    transition: border-color 120ms, color 120ms;
}
.rt-hero-preset:hover {
    border-color: var(--rt-color-primary-500);
    color: var(--rt-color-fg);
}
.rt-hero-preset span {
    font-weight: 700;
    margin-right: 0.375rem;
}

.rt-hero-output {
    border: 1px solid var(--rt-color-border);
    border-radius: 0.5rem;
    background: var(--rt-color-bg-muted);
    overflow: hidden;
    margin-bottom: 1rem;
}
.rt-hero-output-miss {
    border-color: color-mix(in oklab, var(--rt-color-error-500) 50%, var(--rt-color-border));
}

.rt-hero-output-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--rt-color-border);
    background: var(--rt-color-bg-elevated);
    font-size: 0.75rem;
}
.rt-hero-status {
    font-weight: 700;
    font-family: ui-monospace, monospace;
}
.rt-hero-status-ok { color: var(--rt-color-success-500); }
.rt-hero-status-err { color: var(--rt-color-error-500); }
.rt-hero-content-type {
    color: var(--rt-color-fg-muted);
    font-family: ui-monospace, monospace;
    font-size: 0.7rem;
}
.rt-hero-output-hint {
    margin-left: auto;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--rt-color-fg-muted);
    font-size: 0.65rem;
}

.rt-hero-params {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 0.75rem;
    margin: 0;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--rt-color-border-muted);
    font-size: 0.75rem;
    font-family: ui-monospace, monospace;
}
.rt-hero-params dt { color: var(--rt-color-primary-600); font-weight: 600; }
.rt-hero-params dd { margin: 0; color: var(--rt-color-fg); word-break: break-all; }

.rt-hero-output-pre {
    margin: 0;
    padding: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.55;
    color: var(--rt-color-fg);
    font-family: ui-monospace, monospace;
    max-height: 12rem;
    overflow: auto;
    background: transparent;
}

.rt-hero-output-empty {
    margin: 0;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--rt-color-fg-muted);
}
.rt-hero-output-empty code {
    background: var(--rt-color-bg-elevated);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.85em;
    font-family: ui-monospace, monospace;
}

.rt-hero-card-hint {
    font-size: 0.8125rem;
    color: var(--rt-color-fg-muted);
    margin: 0;
    line-height: 1.5;
}
.rt-hero-card-hint code {
    background: var(--rt-color-bg-elevated);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.85em;
    font-family: ui-monospace, monospace;
}
</style>
