<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import { DEFAULT_REQUEST, DEFAULT_RESULT } from './request-line';

type PipelineStep = {
    name: string;
    detail: string;
};

type PipelineFrontmatter = {
    title: string;
    steps: PipelineStep[];
};

const { frontmatter } = useData();

const pipeline = computed(() => frontmatter.value.pipeline as PipelineFrontmatter);
const label = computed(() => `${pipeline.value.title}: ${pipeline.value.steps.map((step) => step.name).join(', ')}`);

// One node lights up every 0.7s of the 7s cycle.
function nodeStyle(index: number) {
    return { animationDelay: `${index * 0.7}s` };
}
</script>

<template>
    <RtSection
        surface="dark"
        class="home-pipeline"
    >
        <div
            role="img"
            :aria-label="label"
        >
            <div
                class="home-pipeline__head"
                aria-hidden="true"
            >
                <span>{{ pipeline.title }}</span>
                <span class="home-pipeline__trace">{{ DEFAULT_REQUEST }} → {{ DEFAULT_RESULT.status }}</span>
            </div>
            <div
                class="home-pipeline__pipe"
                aria-hidden="true"
            >
                <div class="home-pipeline__track" />
                <div class="home-pipeline__pulse" />
                <ol class="home-pipeline__stages">
                    <li
                        v-for="(step, index) in pipeline.steps"
                        :key="step.name"
                        class="home-pipeline__stage"
                    >
                        <span
                            class="home-pipeline__node"
                            :style="nodeStyle(index)"
                        />
                        <span class="home-pipeline__name">{{ step.name }}</span>
                        <span class="home-pipeline__detail">{{ step.detail }}</span>
                    </li>
                </ol>
            </div>
        </div>
    </RtSection>
</template>

<style scoped>
.home-pipeline {
    --home-pipeline-cycle: 7s;

    padding: 8px 0 36px;
    background:
        radial-gradient(rgba(148, 163, 255, 0.09) 1px, transparent 1.2px) 0 0 / 22px 22px,
        var(--rt-surface-dark);
}

.home-pipeline::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: var(--rt-border-on-dark-strong);
    content: '';
}

.home-pipeline__head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    color: var(--rt-on-dark-faint);
    font-family: var(--rt-font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.home-pipeline__trace {
    letter-spacing: 0;
    text-transform: none;
}

.home-pipeline__pipe {
    position: relative;
    padding-top: 14px;
}

.home-pipeline__track {
    position: absolute;
    top: 20px;
    right: 6px;
    left: 6px;
    height: 1px;
    background: repeating-linear-gradient(90deg, var(--rt-border-on-dark-strong) 0 6px, transparent 6px 11px);
}

.home-pipeline__track::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--rt-gradient-brand);
    content: '';
    transform: scaleX(0);
    transform-origin: left;
    animation: home-pipeline-fill var(--home-pipeline-cycle) infinite;
}

.home-pipeline__pulse {
    position: absolute;
    top: 15px;
    left: 6px;
    width: 11px;
    height: 11px;
    margin-left: -5px;
    border-radius: 50%;
    background: var(--rt-color-accent-400);
    box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.18), 0 0 18px 4px rgba(34, 211, 238, 0.55);
    animation: home-pipeline-pulse var(--home-pipeline-cycle) infinite;
}

.home-pipeline__stages {
    position: relative;
    display: flex;
    justify-content: space-between;
    margin: 0;
    padding: 0;
    list-style: none;
}

.home-pipeline__stage {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    min-width: 0;
    font-family: var(--rt-font-mono);
}

.home-pipeline__stage:first-child {
    align-items: flex-start;
}

.home-pipeline__stage:last-child {
    align-items: flex-end;
}

.home-pipeline__node {
    width: 13px;
    height: 13px;
    box-sizing: border-box;
    border: 1px solid var(--rt-border-on-dark-strong);
    border-radius: 3px;
    background: var(--rt-surface-dark);
    transform: rotate(45deg);
    animation: home-pipeline-node var(--home-pipeline-cycle) infinite;
}

.home-pipeline__name {
    color: var(--rt-on-dark);
    font-size: 12px;
    white-space: nowrap;
}

.home-pipeline__detail {
    display: none;
    color: var(--rt-on-dark-faint);
    font-size: 11px;
    white-space: nowrap;
}

@media (min-width: 760px) {
    .home-pipeline__detail {
        display: block;
    }

    .home-pipeline__name {
        font-size: 13px;
    }
}

@media (max-width: 430px) {
    .home-pipeline__name {
        font-size: 10.5px;
    }
}

@keyframes home-pipeline-pulse {
    0% { left: 6px; opacity: 0; }
    3% { opacity: 1; }
    48% { left: calc(100% - 6px); opacity: 1; }
    54%, 100% { left: calc(100% - 6px); opacity: 0; }
}

@keyframes home-pipeline-fill {
    0% { transform: scaleX(0); opacity: 1; }
    48%, 82% { transform: scaleX(1); opacity: 1; }
    94%, 100% { transform: scaleX(1); opacity: 0; }
}

@keyframes home-pipeline-node {
    0% { border-color: var(--rt-border-on-dark-strong); background: var(--rt-surface-dark); box-shadow: none; }
    3%, 60% { border-color: var(--rt-color-accent-400); background: var(--rt-color-primary-500); box-shadow: 0 0 14px rgba(139, 92, 246, 0.7); }
    74%, 100% { border-color: var(--rt-border-on-dark-strong); background: var(--rt-surface-dark); box-shadow: none; }
}

@media (prefers-reduced-motion: reduce) {
    .home-pipeline__track::after,
    .home-pipeline__pulse,
    .home-pipeline__node {
        animation: none;
    }

    .home-pipeline__track::after {
        transform: scaleX(1);
    }

    .home-pipeline__pulse {
        left: calc(100% - 6px);
    }

    .home-pipeline__node {
        border-color: var(--rt-color-accent-400);
        background: var(--rt-color-primary-500);
    }
}
</style>
