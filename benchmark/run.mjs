import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import autocannon from 'autocannon';

function readPositiveNumber(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid ${name}: "${raw}". Expected a positive number.`);
    }
    return value;
}

const TRIALS = readPositiveNumber('TRIALS', 3);
const WARMUP = readPositiveNumber('WARMUP', 10);
const DURATION = readPositiveNumber('DURATION', 10);
const CONNECTIONS = readPositiveNumber('CONNECTIONS', 100);
const PIPELINING = readPositiveNumber('PIPELINING', 10);
const URL = process.env.URL ?? 'http://127.0.0.1:3000';
const RUNTIME = process.env.RUNTIME ?? 'node';
const RUNTIME_BIN = process.env.RUNTIME_BIN ?? RUNTIME;

async function runOne() {
    const server = spawn(RUNTIME_BIN, ['benchmark/server.mjs'], { stdio: ['ignore', 'ignore', 'inherit'] });
    try {
        // wait for server to bind
        await wait(800);

        // warmup
        await autocannon({
            url: URL,
            connections: CONNECTIONS,
            pipelining: PIPELINING,
            duration: WARMUP,
        });

        // measure
        const result = await autocannon({
            url: URL,
            connections: CONNECTIONS,
            pipelining: PIPELINING,
            duration: DURATION,
        });
        return result;
    } finally {
        server.kill('SIGINT');
        // give srvx the configured 5s grace... but cap at 1s for benchmarks
        await wait(800);
        // `server.killed` flips when the signal is sent, not when the
        // process exits — check exit state directly so SIGKILL actually
        // fires when SIGINT didn't take.
        if (server.exitCode === null && server.signalCode === null) {
            server.kill('SIGKILL');
        }
    }
}

console.log(`runtime=${RUNTIME}  resolver=${process.env.RESOLVER ?? 'linear'}  url=${URL}  trials=${TRIALS} warmup=${WARMUP}s duration=${DURATION}s connections=${CONNECTIONS} pipelining=${PIPELINING}`);

const reqs = [];
const lats = [];
for (let i = 0; i < TRIALS; i++) {
    process.stdout.write(`trial ${i + 1}/${TRIALS}... `);
    const r = await runOne();
    reqs.push(r.requests.average);
    lats.push(r.latency.average);
    console.log(`req/s=${r.requests.average.toFixed(0)} lat=${r.latency.average.toFixed(2)}ms`);
}

const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const min = (xs) => Math.min(...xs);
const max = (xs) => Math.max(...xs);

console.log('---');
console.log(`req/s   median=${median(reqs).toFixed(0)}  min=${min(reqs).toFixed(0)}  max=${max(reqs).toFixed(0)}  spread=${((max(reqs) - min(reqs)) / median(reqs) * 100).toFixed(1)}%`);
console.log(`latency median=${median(lats).toFixed(2)}  min=${min(lats).toFixed(2)}  max=${max(lats).toFixed(2)}`);
