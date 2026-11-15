<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import InlineCode from './InlineCode.vue';

type PluginItem = {
    package: string;
    summary: string;
    link: string;
};

type PluginsFrontmatter = {
    eyebrow: string;
    title: string;
    lede: string;
    link: { text: string; link: string };
    items: PluginItem[];
};

const SCOPE = '@routup/';

const { frontmatter } = useData();

const plugins = computed(() => frontmatter.value.plugins as PluginsFrontmatter);

// The scope is set in a fainter colour than the package name.
const items = computed(() => plugins.value.items.map((item) => ({
    ...item,
    scope: item.package.startsWith(SCOPE) ? SCOPE : '',
    name: item.package.startsWith(SCOPE) ? item.package.slice(SCOPE.length) : item.package,
})));
</script>

<template>
    <RtSection class="home-plugins">
        <div class="home-plugins__head">
            <div class="home-plugins__intro">
                <RtHeading
                    :eyebrow="plugins.eyebrow"
                    :title="plugins.title"
                />
                <p class="home-plugins__lede">
                    <InlineCode :text="plugins.lede" />
                </p>
            </div>
            <a
                class="home-plugins__more"
                :href="plugins.link.link"
            >
                {{ plugins.link.text }}
                <span aria-hidden="true">→</span>
            </a>
        </div>

        <ul class="home-plugins__grid">
            <li
                v-for="item in items"
                :key="item.package"
            >
                <RtCard
                    class="home-plugins__card"
                    :href="item.link"
                >
                    <code class="home-plugins__package"><span>{{ item.scope }}</span>{{ item.name }}</code>
                    <p>{{ item.summary }}</p>
                </RtCard>
            </li>
        </ul>
    </RtSection>
</template>

<style scoped>
.home-plugins__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
}

.home-plugins__intro {
    display: grid;
    gap: 14px;
    max-width: 720px;
}

.home-plugins__lede {
    margin: 0;
    color: var(--rt-section-fg-muted);
    font-size: 17px;
    line-height: 1.6;
}

.home-plugins__lede :deep(code) {
    padding: 0;
    background: none;
    color: var(--rt-section-fg);
    font-family: var(--rt-font-mono);
    font-size: 0.9em;
}

.home-plugins__more {
    color: var(--rt-section-accent);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
}

.home-plugins__more:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
}

.home-plugins__more:focus-visible {
    outline: 2px solid var(--rt-color-primary-500);
    outline-offset: 2px;
}

.home-plugins__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    margin: 40px 0 0;
    padding: 0;
    list-style: none;
}

@media (min-width: 520px) {
    .home-plugins__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 820px) {
    .home-plugins__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1080px) {
    .home-plugins__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.home-plugins__grid > li {
    min-width: 0;
    margin: 0;
}

.home-plugins__card {
    gap: 6px;
    padding: 18px;
}

.home-plugins__card p {
    font-size: 14px;
}

.home-plugins__card .home-plugins__package {
    overflow-wrap: anywhere;
    color: var(--rt-color-fg);
    font-size: 13.5px;
    font-weight: 500;
}

.home-plugins__package span {
    color: var(--rt-color-fg-muted);
    font-weight: 400;
}
</style>
