<script setup lang="ts">
interface Feature {
    icon: string;
    title: string;
    detail: string;
}

const features: Feature[] = [
    {
        icon: '🌐',
        title: 'Web Standards',
        detail: 'Built on srvx — every handler receives a real Request and returns whatever toResponse() can convert: string, object, stream, Response.',
    },
    {
        icon: '🏃‍♂️',
        title: 'Runtime Agnostic',
        detail: 'Conditional exports auto-pick the right adapter for Node, Bun, Deno, Cloudflare Workers, Service Workers, or any Fetch-ready runtime.',
    },
    {
        icon: '🚀',
        title: 'Return-based handlers',
        detail: 'No res.send(). Return a value; the pipeline picks the Content-Type, sets ETag/304, and ships the response — async or sync, your call.',
    },
    {
        icon: '🧅',
        title: 'Onion middleware',
        detail: 'Call event.next() to wrap downstream handlers. Mutate event.response before, transform the resolved value after.',
    },
    {
        icon: '🔌',
        title: 'Plugins & hooks',
        detail: 'Install reusable plugins with name + version + dependencies. Subscribe to request, response, and error lifecycle events.',
    },
    {
        icon: '🌳',
        title: 'Tree-shakeable helpers',
        detail: 'Tiny standalone functions — getRequestIP, sendRedirect, setResponseCacheHeaders. Import only what you use; the rest is gone.',
    },
];
</script>

<template>
    <section class="rt-features">
        <div class="rt-features-inner">
            <h2 class="rt-features-heading">
                Six pieces. One small core.
            </h2>
            <p class="rt-features-sub">
                Routup keeps the surface narrow — Router, Handler, Event — and lets the runtime, the
                Web platform, and tree-shaking do the rest.
            </p>
            <div class="rt-features-grid">
                <article
                    v-for="f in features"
                    :key="f.title"
                    class="rt-feature"
                >
                    <div class="rt-feature-icon">
                        {{ f.icon }}
                    </div>
                    <h3 class="rt-feature-title">
                        {{ f.title }}
                    </h3>
                    <p class="rt-feature-detail">
                        {{ f.detail }}
                    </p>
                </article>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-features {
    padding: 4rem 1.5rem;
    background: var(--rt-color-bg);
}

.rt-features-inner {
    max-width: 1152px;
    margin: 0 auto;
}

.rt-features-heading {
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 0.75rem;
    text-align: center;
}

.rt-features-sub {
    text-align: center;
    color: var(--rt-color-fg-muted);
    max-width: 38rem;
    margin: 0 auto 2.5rem;
    line-height: 1.6;
}

.rt-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
}

@media (min-width: 640px) { .rt-features-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px) { .rt-features-grid { grid-template-columns: repeat(3, 1fr); } }

.rt-feature {
    padding: 1.5rem;
    border: 1px solid var(--rt-color-border);
    border-radius: 0.75rem;
    background: var(--rt-color-bg);
    transition: border-color 120ms, transform 120ms;
}
.rt-feature:hover {
    border-color: var(--rt-color-primary-500);
    transform: translateY(-2px);
}

.rt-feature-icon {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
    line-height: 1;
}

.rt-feature-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
}

.rt-feature-detail {
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--rt-color-fg-muted);
    margin: 0;
}
</style>
