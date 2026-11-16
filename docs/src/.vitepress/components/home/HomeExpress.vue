<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import InlineCode from './InlineCode.vue';

type ExpressFrontmatter = {
    eyebrow: string;
    title: string;
    text: string;
    file: string;
    code: string;
    link: { text: string; link: string };
};

const { frontmatter } = useData();

const express = computed(() => frontmatter.value.express as ExpressFrontmatter);
</script>

<template>
    <RtSection
        surface="tinted"
        class="home-express"
    >
        <div class="home-express__split">
            <div class="home-express__head">
                <RtHeading
                    :eyebrow="express.eyebrow"
                    :title="express.title"
                />
                <p class="home-express__lede">
                    <InlineCode :text="express.text" />
                </p>
                <a
                    class="home-express__more"
                    :href="express.link.link"
                >
                    {{ express.link.text }}
                    <span aria-hidden="true">→</span>
                </a>
            </div>

            <RtCodePanel
                class="home-express__panel"
                :title="express.file"
                :code="express.code"
            />
        </div>
    </RtSection>
</template>

<style scoped>
.home-express__split {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
    align-items: center;
}

.home-express__split > * {
    min-width: 0;
}

@media (min-width: 1000px) {
    .home-express__split {
        grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
        gap: 64px;
    }
}

.home-express__head {
    display: grid;
    gap: 20px;
    justify-items: start;
}

.home-express__lede {
    margin: -6px 0 0;
    color: var(--rt-section-fg-muted);
    font-size: 17px;
    line-height: 1.6;
}

.home-express__lede :deep(code) {
    padding: 0;
    background: none;
    color: var(--rt-section-fg);
    font-family: var(--rt-font-mono);
    font-size: 0.9em;
}

.home-express__panel :deep(.rt-code-panel__code) {
    font-size: clamp(12px, 1.3vw, 13px);
}

.home-express__more {
    color: var(--rt-section-accent);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
}

.home-express__more:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
}

.home-express__more:focus-visible {
    outline: 2px solid var(--rt-color-primary-500);
    outline-offset: 2px;
}
</style>
