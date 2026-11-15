<script setup lang="ts">
import type { App } from 'routup';
import { useData } from 'vitepress';
import {
    computed,
    onBeforeUnmount,
    ref,
    watch,
} from 'vue';

import { splitInlineCode } from './inline-code';
import type { RequestLineResult } from './request-line';
import {
    DEFAULT_REQUEST,
    DEFAULT_RESULT,
    createDemoApp,
    parseRequestLine,
    runRequestLine,
} from './request-line';

type HeroAction = {
    text: string;
    link: string;
};

type HeroFrontmatter = {
    eyebrow: { badge: string; text: string };
    title: string;
    highlight: string;
    description: string;
    actions: HeroAction[];
    install: string;
    meta: string;
    code: string;
    request: { label: string };
};

const { frontmatter } = useData();

const hero = computed(() => frontmatter.value.hero as HeroFrontmatter);
const description = computed(() => splitInlineCode(hero.value.description));
const meta = computed(() => hero.value.meta.split('·').map((item) => item.trim()));

// ---------- install pill ----------

const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copyInstall() {
    try {
        await navigator.clipboard.writeText(hero.value.install);
        copied.value = true;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => {
            copied.value = false;
        }, 1500);
    } catch {
        // Clipboard access denied: the command stays selectable.
    }
}

// ---------- live request row ----------

const line = ref(DEFAULT_REQUEST);
// The badge shows the method of the last parsed line (GET for a bare path).
const method = ref(parseRequestLine(DEFAULT_REQUEST)?.method ?? 'GET');
const result = ref<RequestLineResult>(DEFAULT_RESULT);
const valid = ref(true);

let app: App | undefined;
let runId = 0;
let inputTimer: ReturnType<typeof setTimeout> | undefined;

async function evaluate(value: string) {
    const parsed = parseRequestLine(value);
    const id = ++runId;

    if (!parsed) {
        valid.value = false;

        return;
    }

    valid.value = true;
    method.value = parsed.method;

    app ??= createDemoApp();

    const next = await runRequestLine(app, parsed);

    if (id === runId) {
        result.value = next;
    }
}

// The watcher only fires on input, so SSR and hydration render DEFAULT_RESULT.
watch(line, (value) => {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => evaluate(value), 60);
});

onBeforeUnmount(() => {
    clearTimeout(inputTimer);
    clearTimeout(copiedTimer);
});

const statusText = computed(() => (valid.value ? String(result.value.status) : '—'));
const statusClass = computed(() => {
    if (!valid.value) {
        return 'home-hero__status';
    }

    return result.value.status < 400 ?
        'home-hero__status home-hero__status--ok' :
        'home-hero__status home-hero__status--error';
});
const bodyClass = computed(() => (valid.value ? 'home-hero__body' : 'home-hero__body home-hero__body--stale'));
</script>

<template>
    <RtSection
        surface="dark"
        class="home-hero"
    >
        <div class="home-hero__grid">
            <div class="home-hero__copy">
                <span class="home-hero__eyebrow"><b>{{ hero.eyebrow.badge }}</b> {{ hero.eyebrow.text }}</span>
                <h1 class="home-hero__title">
                    {{ hero.title }}<br><span class="home-hero__highlight">{{ hero.highlight }}</span>
                </h1>
                <p class="home-hero__lede">
                    <template
                        v-for="(segment, index) in description"
                        :key="index"
                    >
                        <code v-if="segment.code">{{ segment.text }}</code><span v-else>{{ segment.text }}</span>
                    </template>
                </p>
                <div class="home-hero__actions">
                    <RtButton
                        v-for="(action, index) in hero.actions"
                        :key="action.link"
                        :href="action.link"
                        :variant="index === 0 ? 'primary' : 'ghost'"
                    >
                        {{ action.text }}
                        <span
                            v-if="index === 0"
                            aria-hidden="true"
                        >→</span>
                    </RtButton>
                </div>
                <div class="home-hero__install">
                    <span><span
                        class="home-hero__prompt"
                        aria-hidden="true"
                    >$</span> {{ hero.install }}</span>
                    <button
                        class="home-hero__copy-button"
                        type="button"
                        :aria-label="copied ? 'Copied' : 'Copy install command'"
                        @click="copyInstall"
                    >
                        <svg
                            v-if="copied"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            aria-hidden="true"
                        ><path d="M3 8.5 6.5 12 13 4.5" /></svg>
                        <svg
                            v-else
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            aria-hidden="true"
                        ><rect
                            x="5"
                            y="5"
                            width="8.5"
                            height="8.5"
                            rx="1.5"
                        /><path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" /></svg>
                    </button>
                </div>
                <ul class="home-hero__meta">
                    <li
                        v-for="item in meta"
                        :key="item"
                    >
                        {{ item }}
                    </li>
                </ul>
            </div>

            <RtCodePanel
                class="home-hero__panel"
                title="app.ts"
                :code="hero.code"
            >
                <template #footer>
                    <div class="home-hero__request">
                        <RtMethodBadge :method="method" />
                        <label
                            class="home-hero__sr-only"
                            for="home-hero-request"
                        >{{ hero.request.label }}</label>
                        <input
                            id="home-hero-request"
                            v-model="line"
                            class="home-hero__input"
                            type="text"
                            spellcheck="false"
                            autocomplete="off"
                            autocapitalize="off"
                        >
                        <span
                            class="home-hero__arrow"
                            aria-hidden="true"
                        >→</span>
                        <span
                            class="home-hero__result"
                            aria-live="polite"
                        >
                            <span :class="statusClass">{{ statusText }}</span>
                            <span :class="bodyClass">{{ result.body }}</span>
                        </span>
                    </div>
                </template>
            </RtCodePanel>
        </div>
    </RtSection>
</template>

<style scoped>
.home-hero {
    display: flex;
    align-items: center;
    min-height: min(calc(100vh - 120px), 880px);
    padding: calc(var(--rt-nav-offset, 0px) + 56px) 0 48px;
}

.home-hero__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 48px;
    align-items: center;
}

@media (min-width: 1040px) {
    .home-hero__grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.04fr);
        gap: 56px;
    }
}

.home-hero__copy {
    min-width: 0;
}

.home-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
    padding: 5px 12px 5px 6px;
    border: 1px solid var(--rt-border-on-dark-strong);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--rt-on-dark-muted);
    font-family: var(--rt-font-mono);
    font-size: 12px;
    letter-spacing: 0.02em;
}

.home-hero__eyebrow b {
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--rt-color-accent-400);
    color: var(--rt-surface-dark);
    font-size: 11px;
    font-weight: 500;
}

.home-hero__title {
    margin: 22px 0 0;
    padding: 0;
    border: 0;
    color: var(--rt-on-dark);
    font-size: clamp(40px, 6.4vw, 72px);
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.035em;
}

.home-hero__highlight {
    background: var(--rt-gradient-brand);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}

.home-hero__lede {
    max-width: 34em;
    margin: 22px 0 0;
    color: var(--rt-on-dark-muted);
    font-size: clamp(16px, 1.5vw, 18px);
    line-height: 1.6;
}

.home-hero__lede code {
    color: var(--rt-on-dark);
    font-family: var(--rt-font-mono);
    font-size: 0.92em;
}

.home-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
}

.home-hero__install {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    box-sizing: border-box;
    max-width: 100%;
    height: 42px;
    margin-top: 26px;
    padding: 0 8px 0 16px;
    border: 1px dashed var(--rt-border-on-dark-strong);
    border-radius: 10px;
    background: rgba(6, 182, 212, 0.04);
    color: var(--rt-on-dark);
    font-family: var(--rt-font-mono);
    font-size: 14px;
}

.home-hero__prompt {
    color: var(--rt-color-accent-400);
}

.home-hero__copy-button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--rt-on-dark-muted);
    cursor: pointer;
}

.home-hero__copy-button:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--rt-on-dark);
}

.home-hero__copy-button:focus-visible {
    outline: 2px solid var(--rt-color-accent-400);
    outline-offset: 2px;
}

.home-hero__copy-button svg {
    width: 15px;
    height: 15px;
}

.home-hero__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 22px 0 0;
    padding: 0;
    color: var(--rt-on-dark-faint);
    font-family: var(--rt-font-mono);
    font-size: 12px;
    list-style: none;
}

.home-hero__meta li + li::before {
    margin-right: 14px;
    content: '·';
}

.home-hero__panel {
    box-shadow: 0 40px 80px -40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(139, 92, 246, 0.06);
}

/* ---------- request row ---------- */
.home-hero__request {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    width: 100%;
    min-width: 0;
}

.home-hero__input {
    flex: 1 1 10ch;
    min-width: 0;
    max-width: 22ch;
    padding: 2px 6px;
    border: 1px solid transparent;
    border-bottom-color: var(--rt-border-on-dark-strong);
    border-radius: 4px;
    background: transparent;
    color: var(--rt-on-dark);
    font: inherit;
}

.home-hero__input:hover {
    border-bottom-color: var(--rt-on-dark-faint);
}

.home-hero__input:focus-visible {
    border-color: var(--rt-color-accent-400);
    outline: none;
}

.home-hero__arrow {
    color: var(--rt-on-dark-faint);
}

.home-hero__result {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-width: 0;
}

.home-hero__status {
    color: var(--rt-on-dark-muted);
    font-weight: 600;
}

.home-hero__status--ok {
    color: var(--rt-method-get);
}

.home-hero__status--error {
    color: var(--rt-color-warning-500);
}

.home-hero__body {
    overflow-wrap: anywhere;
    color: var(--rt-color-accent-400);
}

.home-hero__body--stale {
    opacity: 0.45;
}

.home-hero__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

@media (max-width: 719px) {
    .home-hero {
        min-height: 0;
        padding: calc(var(--rt-nav-offset, 0px) + 48px) 0 40px;
    }
}
</style>
