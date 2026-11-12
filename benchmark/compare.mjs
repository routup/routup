/**
 * Paired end-to-end comparison of two builds — answers "did this
 * change move req/s?" on a machine that is doing other things.
 *
 * Each round runs both builds back to back (order alternates per
 * round), so background load hits both sides alike. The verdict is the
 * median of the per-round ratios, not a comparison of two independent
 * medians.
 *
 *   npm run build:js && cp -R dist node_modules/.cache/dist-baseline
 *   # ...change code...
 *   npm run build:js && node benchmark/compare.mjs
 *
 * Env: BASE (default node_modules/.cache/dist-baseline), HEAD (default
 * dist), ROUNDS (6), WARMUP (2), DURATION (6), CONNECTIONS (100),
 * PIPELINING (10), RESOLVER, CACHE, URL_PATH (default /).
 */
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import autocannon from 'autocannon';

function readPositiveNumber(name, fallback) {
    const raw = process.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid ${name}: "${raw}". Expected a positive number.`);
    }

    return value;
}

const BASE = process.env.BASE ?? 'node_modules/.cache/dist-baseline';
const HEAD = process.env.HEAD ?? 'dist';
const ROUNDS = readPositiveNumber('ROUNDS', 6);
const WARMUP = readPositiveNumber('WARMUP', 2);
const DURATION = readPositiveNumber('DURATION', 6);
const CONNECTIONS = readPositiveNumber('CONNECTIONS', 100);
const PIPELINING = readPositiveNumber('PIPELINING', 10);
const URL = `http://127.0.0.1:3000${process.env.URL_PATH ?? '/'}`;

async function runOne(dist) {
    const server = spawn('node', ['benchmark/server.mjs'], {
        stdio: ['ignore', 'ignore', 'ignore'],
        env: { ...process.env, DIST: dist },
    });

    try {
        await wait(800);

        const options = {
            url: URL,
            connections: CONNECTIONS,
            pipelining: PIPELINING,
        };

        await autocannon({ ...options, duration: WARMUP });

        const result = await autocannon({ ...options, duration: DURATION });

        if (result.non2xx > 0 || result.errors > 0) {
            throw new Error(`${dist}: ${result.non2xx} non-2xx responses, ${result.errors} errors`);
        }

        return result.requests.average;
    } finally {
        server.kill('SIGKILL');
        await wait(300);
    }
}

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);

    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

console.log(`base=${BASE}  head=${HEAD}  url=${URL}  resolver=${process.env.RESOLVER ?? 'linear'}  rounds=${ROUNDS} warmup=${WARMUP}s duration=${DURATION}s`);

const base = [];
const head = [];
const ratios = [];

for (let i = 0; i < ROUNDS; i++) {
    let b;
    let h;

    if (i % 2 === 0) {
        b = await runOne(BASE);
        h = await runOne(HEAD);
    } else {
        h = await runOne(HEAD);
        b = await runOne(BASE);
    }

    base.push(b);
    head.push(h);
    ratios.push(h / b);

    console.log(`round ${i + 1}/${ROUNDS}  base=${b.toFixed(0)}  head=${h.toFixed(0)}  ${((h / b - 1) * 100).toFixed(1)}%`);
}

console.log('---');
console.log(`base req/s median=${median(base).toFixed(0)}`);
console.log(`head req/s median=${median(head).toFixed(0)}`);
console.log(`paired delta median=${((median(ratios) - 1) * 100).toFixed(1)}%  min=${((Math.min(...ratios) - 1) * 100).toFixed(1)}%  max=${((Math.max(...ratios) - 1) * 100).toFixed(1)}%`);
