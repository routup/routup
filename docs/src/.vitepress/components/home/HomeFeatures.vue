<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import { splitInlineCode } from './inline-code';

type FeatureItem = {
    title: string;
    text: string;
    code: string;
};

type FeaturesFrontmatter = {
    eyebrow: string;
    title: string;
    lede: string;
    items: FeatureItem[];
};

const { frontmatter } = useData();

const features = computed(() => frontmatter.value.features as FeaturesFrontmatter);
const items = computed(() => features.value.items.map((item, index) => ({
    ...item,
    index: String(index + 1).padStart(2, '0'),
    segments: splitInlineCode(item.text),
})));
</script>

<template>
    <RtSection
        surface="tinted"
        class="home-features"
    >
        <RtHeading
            :eyebrow="features.eyebrow"
            :title="features.title"
            :lede="features.lede"
        />
        <ul class="home-features__grid">
            <li
                v-for="item in items"
                :key="item.title"
            >
                <RtCard class="home-features__card">
                    <span class="home-features__index">{{ item.index }}</span>
                    <h3>{{ item.title }}</h3>
                    <p>
                        <template
                            v-for="(segment, index) in item.segments"
                            :key="index"
                        >
                            <code v-if="segment.code">{{ segment.text }}</code><span v-else>{{ segment.text }}</span>
                        </template>
                    </p>
                    <pre class="home-features__snippet"><code>{{ item.code }}</code></pre>
                </RtCard>
            </li>
        </ul>
    </RtSection>
</template>

<style scoped>
.home-features__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1px;
    margin: 44px 0 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--rt-color-border);
    border-radius: 14px;
    background: var(--rt-color-border);
    list-style: none;
}

@media (min-width: 640px) {
    .home-features__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 960px) {
    .home-features__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

.home-features__grid > li {
    min-width: 0;
}

.home-features__card {
    grid-template-rows: auto auto 1fr auto;
    gap: 12px;
    padding: 26px 24px 24px;
    border: 0;
    border-radius: 0;
}

.home-features__index {
    color: var(--rt-color-fg-muted);
    font-family: var(--rt-font-mono);
    font-size: 12px;
}

.home-features__snippet {
    margin: 6px 0 0;
    padding: 10px 12px;
    overflow-x: auto;
    border: 1px solid var(--rt-color-border);
    border-radius: 8px;
    background: var(--rt-color-bg-muted);
    color: var(--rt-color-fg-muted);
    font-family: var(--rt-font-mono);
    font-size: 12.5px;
    line-height: 1.7;
    white-space: pre;
}

.home-features__snippet code {
    padding: 0;
    background: none;
    color: inherit;
    font-size: inherit;
}
</style>
