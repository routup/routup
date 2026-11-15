<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import InlineCode from './InlineCode.vue';

type RuntimeItem = {
    name: string;
    entry: string;
};

type RuntimesFrontmatter = {
    eyebrow: string;
    title: string;
    highlight: string;
    lede: string;
    core: string;
    items: RuntimeItem[];
};

// Dot colours, one per chip in order; decorative.
const DOT_COLORS = ['#10b981', '#f59e0b', '#22d3ee', '#f97316', '#3b82f6', '#a78bfa'];

const { frontmatter } = useData();

const runtimes = computed(() => frontmatter.value.runtimes as RuntimesFrontmatter);

// From 640px the chips sit on a circle, the first one at the top; a
// packet leaves the core along each spoke 0.6s after the previous one.
const items = computed(() => {
    const step = 360 / runtimes.value.items.length;

    return runtimes.value.items.map((item, index) => ({
        ...item,
        slotStyle: { '--home-runtimes-angle': `${index * step - 90}deg` },
        spokeStyle: {
            '--home-runtimes-angle': `${index * step - 90}deg`,
            '--home-runtimes-delay': `${index * 0.6}s`,
        },
        dotStyle: { '--home-runtimes-dot': DOT_COLORS[index % DOT_COLORS.length] },
    }));
});
</script>

<template>
    <RtSection
        surface="aurora"
        class="home-runtimes"
    >
        <!-- RtHeading renders a plain title; this one carries the gradient highlight. -->
        <div class="rt-heading rt-heading--center">
            <span class="rt-heading__eyebrow">{{ runtimes.eyebrow }}</span>
            <h2 class="rt-heading__title rt-heading__title--h2">
                {{ runtimes.title }} <span class="home-runtimes__highlight">{{ runtimes.highlight }}</span>
            </h2>
        </div>
        <p class="home-runtimes__lede">
            <InlineCode :text="runtimes.lede" />
        </p>

        <div class="home-runtimes__orbit">
            <div
                class="home-runtimes__halo"
                aria-hidden="true"
            />
            <div
                class="home-runtimes__ring-inner"
                aria-hidden="true"
            />
            <div
                class="home-runtimes__ring"
                aria-hidden="true"
            />
            <div
                class="home-runtimes__spokes"
                aria-hidden="true"
            >
                <span
                    v-for="item in items"
                    :key="item.entry"
                    class="home-runtimes__spoke"
                    :style="item.spokeStyle"
                />
            </div>

            <div class="home-runtimes__core">
                <div
                    class="home-runtimes__tile"
                    aria-hidden="true"
                >
                    <RtLogo :size="56" />
                </div>
                <code class="home-runtimes__label">{{ runtimes.core }}</code>
            </div>

            <ul class="home-runtimes__chips">
                <li
                    v-for="item in items"
                    :key="item.entry"
                    class="home-runtimes__slot"
                    :style="item.slotStyle"
                >
                    <div class="home-runtimes__chip">
                        <span class="home-runtimes__name"><i
                            class="home-runtimes__dot"
                            :style="item.dotStyle"
                            aria-hidden="true"
                        />{{ item.name }}</span>
                        <code class="home-runtimes__entry">{{ item.entry }}</code>
                    </div>
                </li>
            </ul>
        </div>
    </RtSection>
</template>

<style scoped>
.home-runtimes__highlight {
    background: var(--rt-gradient-brand);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}

.home-runtimes__lede {
    max-width: 720px;
    margin: 14px auto 0;
    color: var(--rt-section-fg-muted);
    font-size: 17px;
    line-height: 1.6;
    text-align: center;
}

.home-runtimes__lede :deep(code) {
    padding: 0;
    background: none;
    color: var(--rt-section-fg);
    font-family: var(--rt-font-mono);
    font-size: 0.9em;
}

/*
 * Under 640px: the core, then a static two-column chip grid.
 * From 640px: the chips orbit the core (see the media query below).
 */
.home-runtimes__orbit {
    display: grid;
    justify-items: center;
    gap: 28px;
    margin: 40px auto 0;
}

.home-runtimes__halo,
.home-runtimes__ring,
.home-runtimes__ring-inner,
.home-runtimes__spokes {
    display: none;
}

.home-runtimes__core {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.home-runtimes__tile {
    display: grid;
    place-items: center;
    width: clamp(72px, 13vw, 104px);
    height: clamp(72px, 13vw, 104px);
    border-radius: 28%;
    background: linear-gradient(160deg, #1a2246, var(--rt-surface-dark));
    box-shadow:
        0 0 0 1px var(--rt-border-on-dark-strong),
        0 0 60px 4px rgba(139, 92, 246, 0.5),
        0 0 120px 10px rgba(34, 211, 238, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.home-runtimes__tile .rt-logo {
    width: 56%;
    height: 56%;
    filter: drop-shadow(0 0 14px rgba(139, 92, 246, 0.7));
}

.home-runtimes__tile :deep(.rt-logo__stop-start) {
    stop-color: var(--rt-color-primary-400);
}

.home-runtimes__tile :deep(.rt-logo__stop-end) {
    stop-color: var(--rt-color-accent-400);
}

.home-runtimes__label {
    padding: 4px 10px;
    border: 1px solid var(--rt-border-on-dark-strong);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.85);
    color: var(--rt-on-dark-muted);
    font-family: var(--rt-font-mono);
    font-size: 12px;
    white-space: nowrap;
}

.home-runtimes__chips {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    box-sizing: border-box;
    width: 100%;
    max-width: 420px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.home-runtimes__slot {
    min-width: 0;
    margin: 0;
}

.home-runtimes__chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    box-sizing: border-box;
    height: 100%;
    padding: 8px 10px;
    border: 1px solid var(--rt-border-on-dark-strong);
    border-radius: 10px;
    background: rgba(15, 22, 48, 0.78);
    box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    color: var(--rt-on-dark);
    text-align: center;
}

.home-runtimes__name {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.home-runtimes__dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--home-runtimes-dot);
    box-shadow: 0 0 8px var(--home-runtimes-dot);
}

.home-runtimes__entry {
    padding: 0;
    overflow-wrap: anywhere;
    background: none;
    color: var(--rt-on-dark-muted);
    font-family: var(--rt-font-mono);
    font-size: 10px;
}

/* ---------- orbit, from 640px ---------- */
@media (min-width: 640px) {
    .home-runtimes__orbit {
        /* Large enough that no chip, at any angle, reaches the core and its label. */
        --home-runtimes-radius: clamp(192px, 30vw, 224px);

        position: relative;
        display: block;
        width: calc(var(--home-runtimes-radius) * 2 + 190px);
        max-width: 100%;
        height: calc(var(--home-runtimes-radius) * 2 + 80px);
    }

    .home-runtimes__halo,
    .home-runtimes__ring,
    .home-runtimes__ring-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        border-radius: 50%;
    }

    .home-runtimes__halo {
        width: calc(var(--home-runtimes-radius) * 1.6);
        height: calc(var(--home-runtimes-radius) * 1.6);
        background: radial-gradient(circle, rgba(139, 92, 246, 0.35), rgba(34, 211, 238, 0.12) 45%, transparent 70%);
        transform: translate(-50%, -50%);
        animation: home-runtimes-breathe 6s ease-in-out infinite;
    }

    .home-runtimes__ring {
        box-sizing: border-box;
        width: calc(var(--home-runtimes-radius) * 2);
        height: calc(var(--home-runtimes-radius) * 2);
        margin: calc(var(--home-runtimes-radius) * -1) 0 0 calc(var(--home-runtimes-radius) * -1);
        border: 1px solid transparent;
        background:
            linear-gradient(var(--rt-surface-dark), var(--rt-surface-dark)) padding-box,
            conic-gradient(from 0deg, rgba(139, 92, 246, 0.9), rgba(34, 211, 238, 0.9), rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.9)) border-box;
        mask: radial-gradient(circle, transparent calc(var(--home-runtimes-radius) - 1px), #000 calc(var(--home-runtimes-radius) - 1px));
        animation: home-runtimes-spin 60s linear infinite;
    }

    .home-runtimes__ring-inner {
        box-sizing: border-box;
        width: calc(var(--home-runtimes-radius) * 1.25);
        height: calc(var(--home-runtimes-radius) * 1.25);
        margin: calc(var(--home-runtimes-radius) * -0.625) 0 0 calc(var(--home-runtimes-radius) * -0.625);
        border: 1px dashed rgba(148, 163, 255, 0.22);
        animation: home-runtimes-spin 90s linear infinite reverse;
    }

    /* Spokes and chips turn together; each chip turns back to stay upright. */
    .home-runtimes__spokes,
    .home-runtimes__chips {
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        width: 0;
        height: 0;
        max-width: none;
        animation: home-runtimes-spin 80s linear infinite;
    }

    .home-runtimes__spoke {
        position: absolute;
        top: 0;
        left: 0;
        width: var(--home-runtimes-radius);
        height: 1px;
        background: linear-gradient(90deg, rgba(139, 92, 246, 0) 18%, rgba(139, 92, 246, 0.55) 50%, rgba(34, 211, 238, 0.75));
        transform: rotate(var(--home-runtimes-angle));
        transform-origin: 0 50%;
    }

    .home-runtimes__spoke::after {
        position: absolute;
        top: -2px;
        left: 20%;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #67e8f9;
        box-shadow: 0 0 10px 2px rgba(34, 211, 238, 0.8);
        opacity: 0;
        content: '';
        animation: home-runtimes-packet 3.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        animation-delay: var(--home-runtimes-delay);
    }

    .home-runtimes__core {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 2;
        transform: translate(-50%, -50%);
    }

    .home-runtimes__slot {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        transform:
            rotate(var(--home-runtimes-angle))
            translateX(var(--home-runtimes-radius))
            rotate(calc(var(--home-runtimes-angle) * -1));
    }

    .home-runtimes__chip {
        position: absolute;
        top: 0;
        left: 0;
        height: auto;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        animation: home-runtimes-unspin 80s linear infinite;
    }
}

@media (min-width: 720px) {
    .home-runtimes__chip {
        padding: 8px 14px;
        border-radius: 12px;
    }

    .home-runtimes__name {
        font-size: 14px;
    }

    .home-runtimes__entry {
        font-size: 11.5px;
    }
}

@keyframes home-runtimes-spin {
    to { transform: rotate(360deg); }
}

@keyframes home-runtimes-unspin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(-360deg); }
}

@keyframes home-runtimes-breathe {
    0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes home-runtimes-packet {
    0% { left: 20%; opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { left: 98%; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .home-runtimes__halo,
    .home-runtimes__ring,
    .home-runtimes__ring-inner,
    .home-runtimes__spokes,
    .home-runtimes__chips,
    .home-runtimes__chip,
    .home-runtimes__spoke::after {
        animation: none;
    }
}
</style>
