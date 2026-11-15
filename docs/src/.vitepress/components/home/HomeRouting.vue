<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import InlineCode from './InlineCode.vue';

type RoutingSyntax = {
    pattern: string;
    label: string;
    matches: string;
};

type RoutingRouter = {
    name: string;
    note?: string;
};

type RoutingFrontmatter = {
    eyebrow: string;
    title: string;
    lede: string;
    map: { title: string; result: string };
    columns: {
        pattern: string;
        label: string;
        matches: string;
    };
    syntax: RoutingSyntax[];
    routers: { text: string; items: RoutingRouter[] };
    link: { text: string; link: string };
};

type MapRoute = {
    y: number;
    method: 'GET' | 'POST' | 'PUT';
    path: string;
    hit?: boolean;
};

const { frontmatter } = useData();

const routing = computed(() => frontmatter.value.routing as RoutingFrontmatter);

// The parameter part of a pattern (`:id`, `{*path}`, `{/:id}`) is highlighted.
const PARAM_PATTERN = /(\{[^}]*\}|:\w+)/;

const syntax = computed(() => routing.value.syntax.map((item) => ({
    ...item,
    parts: item.pattern
        .split(PARAM_PATTERN)
        .map((text, index) => ({ text, param: index % 2 === 1 }))
        .filter((part) => part.text.length > 0),
})));

// The drawing: a route table that GET /users/42 walks to GET /users/:id.
// It is decorative (aria-hidden); the syntax table carries the information.
const GRADIENT_ID = 'home-routing-map-gradient';
const GRADIENT = `url(#${GRADIENT_ID})`;
const HIT_PATH = 'M48 250 H130 L200 180 H320 L370 130 H430';

const BRANCHES = [
    { d: 'M130 250 H430', delay: 1 },
    { d: 'M250 180 H430', delay: 2 },
    { d: 'M130 250 L200 320 H250', delay: 2 },
    { d: 'M250 320 H430', delay: 3 },
    { d: 'M250 320 H320 L370 370 H430', delay: 4 },
];

const BADGE_WIDTH = {
    GET: 36,
    POST: 42,
    PUT: 36,
};

const ROUTES: MapRoute[] = [
    {
        y: 130,
        method: 'GET',
        path: '/users/:id',
        hit: true,
    },
    {
        y: 180,
        method: 'POST',
        path: '/users',
    },
    {
        y: 250,
        method: 'GET',
        path: '/health',
    },
    {
        y: 320,
        method: 'PUT',
        path: '/files',
    },
    {
        y: 370,
        method: 'GET',
        path: '/files/{*path}',
    },
];

const routes = ROUTES.map((route) => {
    const width = BADGE_WIDTH[route.method];

    return {
        ...route,
        width,
        badgeClass: `home-routing__badge home-routing__badge--${route.method.toLowerCase()}`,
        textClass: route.hit ? 'home-routing__route home-routing__route--hit' : 'home-routing__route',
        textX: 446 + width + 8,
    };
});
</script>

<template>
    <RtSection
        surface="tinted"
        class="home-routing"
    >
        <RtHeading
            :eyebrow="routing.eyebrow"
            :title="routing.title"
        />
        <p class="home-routing__lede">
            <InlineCode :text="routing.lede" />
        </p>

        <div class="home-routing__grid">
            <div
                class="home-routing__map-card"
                aria-hidden="true"
            >
                <div class="home-routing__map-caption">
                    <strong>{{ routing.map.title }}</strong>
                    <span>{{ routing.map.result }}</span>
                </div>
                <svg
                    class="home-routing__map"
                    viewBox="0 56 640 344"
                    focusable="false"
                >
                    <defs>
                        <linearGradient
                            :id="GRADIENT_ID"
                            x1="40"
                            y1="0"
                            x2="460"
                            y2="0"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop
                                class="home-routing__stop-start"
                                offset="0"
                            />
                            <stop
                                class="home-routing__stop-end"
                                offset="1"
                            />
                        </linearGradient>
                    </defs>

                    <path
                        v-for="branch in BRANCHES"
                        :key="branch.d"
                        :class="`home-routing__branch home-routing__branch--d${branch.delay}`"
                        :stroke="GRADIENT"
                        pathLength="100"
                        :d="branch.d"
                    />

                    <path
                        class="home-routing__hitline"
                        :stroke="GRADIENT"
                        pathLength="100"
                        :d="HIT_PATH"
                    />
                    <path
                        class="home-routing__spark"
                        pathLength="100"
                        :d="HIT_PATH"
                    />

                    <g class="home-routing__fade-in home-routing__fade-in--1">
                        <rect
                            class="home-routing__chip"
                            x="16"
                            y="198"
                            width="124"
                            height="26"
                            rx="13"
                        />
                        <circle
                            class="home-routing__dot"
                            cx="31"
                            cy="211"
                            r="3.5"
                        />
                        <text
                            class="home-routing__chip-text"
                            x="42"
                            y="215"
                        >GET /users/42</text>
                    </g>

                    <circle
                        class="home-routing__junction-hit"
                        :fill="GRADIENT"
                        cx="48"
                        cy="250"
                        r="7"
                    />
                    <text
                        class="home-routing__root"
                        x="40"
                        y="290"
                    >/</text>

                    <circle
                        class="home-routing__junction"
                        :stroke="GRADIENT"
                        cx="130"
                        cy="250"
                        r="3.5"
                    />
                    <circle
                        class="home-routing__junction-hit"
                        :fill="GRADIENT"
                        cx="250"
                        cy="180"
                        r="6"
                    />
                    <text
                        class="home-routing__segment"
                        x="250"
                        y="164"
                        text-anchor="middle"
                    >users</text>
                    <circle
                        class="home-routing__junction"
                        :stroke="GRADIENT"
                        cx="250"
                        cy="320"
                        r="5"
                    />
                    <text
                        class="home-routing__segment"
                        x="250"
                        y="344"
                        text-anchor="middle"
                    >files</text>

                    <circle
                        class="home-routing__ring"
                        cx="430"
                        cy="130"
                        r="8"
                    />

                    <g
                        v-for="route in routes"
                        :key="route.path"
                    >
                        <circle
                            v-if="route.hit"
                            class="home-routing__junction-hit"
                            :fill="GRADIENT"
                            cx="430"
                            :cy="route.y"
                            r="7"
                        />
                        <circle
                            v-else
                            class="home-routing__junction"
                            :stroke="GRADIENT"
                            cx="430"
                            :cy="route.y"
                            r="5"
                        />
                        <rect
                            :class="route.badgeClass"
                            x="446"
                            :y="route.y - 9"
                            :width="route.width"
                            height="18"
                            rx="4"
                        />
                        <text
                            class="home-routing__badge-text"
                            :x="446 + route.width / 2"
                            :y="route.y + 3.5"
                            text-anchor="middle"
                        >{{ route.method }}</text>
                        <text
                            :class="route.textClass"
                            :x="route.textX"
                            :y="route.y + 4.5"
                        >{{ route.path }}</text>
                    </g>

                    <g class="home-routing__fade-in home-routing__fade-in--2">
                        <path
                            class="home-routing__leader"
                            d="M430 120 V100 H446"
                        />
                        <rect
                            class="home-routing__chip home-routing__chip--result"
                            x="446"
                            y="86"
                            width="186"
                            height="28"
                            rx="14"
                        />
                        <circle
                            class="home-routing__dot"
                            cx="462"
                            cy="100"
                            r="3.5"
                        />
                        <text
                            class="home-routing__chip-text"
                            x="472"
                            y="104"
                        ><tspan font-weight="600">200</tspan> · application/json</text>
                    </g>
                </svg>
            </div>

            <div class="home-routing__syntax">
                <table class="home-routing__table">
                    <thead>
                        <tr>
                            <th scope="col">
                                {{ routing.columns.pattern }}
                            </th>
                            <th scope="col">
                                {{ routing.columns.label }}
                            </th>
                            <th scope="col">
                                {{ routing.columns.matches }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="item in syntax"
                            :key="item.pattern"
                        >
                            <td>
                                <code><template
                                    v-for="(part, index) in item.parts"
                                    :key="index"
                                ><i v-if="part.param">{{ part.text }}</i><template v-else>{{ part.text }}</template></template></code>
                            </td>
                            <td>{{ item.label }}</td>
                            <td>{{ item.matches }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="home-routing__routers">
                    <p>
                        <InlineCode :text="routing.routers.text" />
                    </p>
                    <ul class="home-routing__pills">
                        <li
                            v-for="router in routing.routers.items"
                            :key="router.name"
                            class="home-routing__pill"
                        >
                            {{ router.name }}
                            <small v-if="router.note">{{ router.note }}</small>
                        </li>
                    </ul>
                </div>

                <a
                    class="home-routing__more"
                    :href="routing.link.link"
                >
                    {{ routing.link.text }}
                    <span aria-hidden="true">→</span>
                </a>
            </div>
        </div>
    </RtSection>
</template>

<style scoped>
.home-routing__lede {
    max-width: 720px;
    margin: 14px 0 0;
    color: var(--rt-section-fg-muted);
    font-size: 17px;
    line-height: 1.6;
}

.home-routing__lede :deep(code),
.home-routing__routers :deep(code) {
    padding: 0;
    background: none;
    color: var(--rt-section-fg);
    font-family: var(--rt-font-mono);
    font-size: 0.9em;
}

.home-routing__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
    align-items: start;
    margin-top: 44px;
}

@media (min-width: 1040px) {
    .home-routing__grid {
        grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr);
        gap: 48px;
    }
}

/* ---------- route map ---------- */
.home-routing__map-card {
    min-width: 0;
    padding: 18px 18px 8px;
    border: 1px solid var(--rt-color-border);
    border-radius: 14px;
    background: var(--rt-color-surface);
}

.home-routing__map-caption {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--rt-color-border);
    color: var(--rt-color-fg-muted);
    font-family: var(--rt-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.home-routing__map-caption strong {
    color: var(--rt-color-fg);
    font-weight: 500;
}

.home-routing__map {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
}

.home-routing__map text {
    font-family: var(--rt-font-mono);
}

.home-routing__segment {
    fill: var(--rt-color-fg-muted);
    font-size: 13px;
}

.home-routing__route {
    fill: var(--rt-color-fg-muted);
    font-size: 13.5px;
}

.home-routing__route--hit {
    fill: var(--rt-color-fg);
    font-weight: 500;
}

.home-routing__root {
    fill: var(--rt-color-fg);
    font-size: 26px;
    font-weight: 500;
}

.home-routing__stop-start {
    stop-color: var(--rt-color-primary-500);
}

.home-routing__stop-end {
    stop-color: var(--rt-color-accent-500);
}

/* Dark text: white on the GET and POST colours stays under 4.5:1. */
.home-routing__badge-text {
    fill: var(--rt-surface-dark);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
}

.home-routing__badge--get {
    fill: var(--rt-method-get);
}

.home-routing__badge--post {
    fill: var(--rt-method-post);
}

.home-routing__badge--put {
    fill: var(--rt-method-put);
}

.home-routing__chip {
    fill: var(--rt-color-surface);
    stroke: var(--rt-color-border);
}

.home-routing__chip--result {
    stroke: var(--rt-color-accent-500);
    stroke-opacity: 0.55;
}

.home-routing__chip-text {
    fill: var(--rt-color-fg);
    font-size: 12px;
}

.home-routing__dot {
    fill: var(--rt-method-get);
}

.home-routing__leader {
    fill: none;
    stroke: var(--rt-color-accent-500);
    stroke-width: 1;
    stroke-dasharray: 2 3;
}

.home-routing__branch {
    fill: none;
    stroke-width: 1.25;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.45;
    stroke-dasharray: 100;
    stroke-dashoffset: 0;
    animation: home-routing-draw 1.4s cubic-bezier(0.6, 0.05, 0.3, 1) both;
}

.home-routing__branch--d1 { animation-delay: 0.15s; }
.home-routing__branch--d2 { animation-delay: 0.3s; }
.home-routing__branch--d3 { animation-delay: 0.45s; }
.home-routing__branch--d4 { animation-delay: 0.6s; }

.home-routing__hitline {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 100;
    stroke-dashoffset: 0;
    animation: home-routing-draw 1.6s cubic-bezier(0.6, 0.05, 0.3, 1) 0.2s both;
}

.home-routing__spark {
    fill: none;
    stroke: #fff;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 0.01 99.99;
    filter: drop-shadow(0 0 3px rgba(6, 182, 212, 0.9));
    animation: home-routing-travel 3.2s cubic-bezier(0.45, 0, 0.55, 1) 1.9s infinite both;
}

.home-routing__junction {
    fill: var(--rt-color-surface);
    stroke-width: 1.5;
}

.home-routing__junction-hit {
    stroke: var(--rt-color-surface);
    stroke-width: 2.5;
}

.home-routing__ring {
    fill: none;
    stroke: var(--rt-color-accent-500);
    stroke-width: 1.25;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: home-routing-ring 3.2s ease-out 1.9s infinite;
}

.home-routing__fade-in--1 {
    animation: home-routing-fade-in 0.6s ease 1.5s both;
}

.home-routing__fade-in--2 {
    animation: home-routing-fade-in 0.6s ease 1.9s both;
}

/* ---------- syntax table ---------- */
.home-routing__syntax {
    display: grid;
    gap: 24px;
    min-width: 0;
}

.home-routing__table {
    width: 100%;
    margin: 0;
    overflow: hidden;
    border-collapse: collapse;
    border-style: hidden;
    border-radius: 14px;
    background: var(--rt-color-surface);
    box-shadow: 0 0 0 1px var(--rt-color-border);
    font-size: 14px;
    table-layout: fixed;
}

.home-routing__table th {
    padding: 12px 16px;
    border: 0;
    border-bottom: 1px solid var(--rt-color-border);
    background: none;
    color: var(--rt-color-fg-muted);
    font-family: var(--rt-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-align: left;
    text-transform: uppercase;
}

.home-routing__table th:first-child {
    width: 36%;
}

.home-routing__table th:nth-child(2) {
    width: 28%;
}

.home-routing__table tr {
    border: 0;
    background: none;
}

.home-routing__table td {
    padding: 14px 16px;
    overflow-wrap: anywhere;
    border: 0;
    border-top: 1px solid var(--rt-color-border);
    color: var(--rt-color-fg-muted);
    vertical-align: top;
}

.home-routing__table td:first-child code {
    padding: 0;
    background: none;
    color: var(--rt-color-fg);
    font-family: var(--rt-font-mono);
    font-size: 13.5px;
}

.home-routing__table td:first-child i {
    color: var(--rt-color-primary-text);
    font-style: normal;
}

.home-routing__table td:last-child {
    font-family: var(--rt-font-mono);
    font-size: 12.5px;
}

@media (max-width: 520px) {
    .home-routing__table {
        font-size: 13px;
    }

    .home-routing__table th,
    .home-routing__table td {
        padding: 12px 10px;
    }

    .home-routing__table td:first-child code {
        font-size: 12.5px;
    }
}

/* ---------- routers ---------- */
.home-routing__routers {
    display: grid;
    gap: 12px;
}

.home-routing__routers p {
    margin: 0;
    color: var(--rt-section-fg-muted);
    font-size: 15px;
    line-height: 1.6;
}

.home-routing__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.home-routing__pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    height: 32px;
    margin: 0;
    padding: 0 12px;
    border: 1px solid var(--rt-color-border);
    border-radius: 8px;
    background: var(--rt-color-surface);
    color: var(--rt-color-fg);
    font-family: var(--rt-font-mono);
    font-size: 12.5px;
}

.home-routing__pill small {
    color: var(--rt-color-fg-muted);
    font-size: 11px;
}

.home-routing__more {
    justify-self: start;
    color: var(--rt-section-accent);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
}

.home-routing__more:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
}

.home-routing__more:focus-visible {
    outline: 2px solid var(--rt-color-primary-500);
    outline-offset: 2px;
}

@keyframes home-routing-draw {
    from { stroke-dashoffset: 100; }
    to { stroke-dashoffset: 0; }
}

@keyframes home-routing-travel {
    0% { stroke-dashoffset: 0; opacity: 0; }
    8% { opacity: 1; }
    80% { opacity: 1; }
    90%, 100% { stroke-dashoffset: -100; opacity: 0; }
}

@keyframes home-routing-ring {
    0%, 78% { opacity: 0; transform: scale(0.6); }
    84% { opacity: 0.9; }
    100% { opacity: 0; transform: scale(2.6); }
}

@keyframes home-routing-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
    .home-routing__branch,
    .home-routing__hitline,
    .home-routing__fade-in--1,
    .home-routing__fade-in--2 {
        animation: none;
    }

    .home-routing__spark,
    .home-routing__ring {
        display: none;
        animation: none;
    }
}
</style>
