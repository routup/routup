import autocannon from 'autocannon';
import { startServer } from './server-process.mjs';

function readPositiveNumber(name, fallback, { integer = false } = {}) {
    const raw = process.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0 || (integer && !Number.isSafeInteger(value))) {
        throw new Error(
            `Invalid ${name}: "${raw}". Expected a positive${integer ? ' integer' : ' number'}.`,
        );
    }

    return value;
}

const TRIALS = readPositiveNumber('TRIALS', 3, { integer: true });
const WARMUP = readPositiveNumber('WARMUP', 10);
const DURATION = readPositiveNumber('DURATION', 10);
const CONNECTIONS = readPositiveNumber('CONNECTIONS', 100, { integer: true });
const PIPELINING = readPositiveNumber('PIPELINING', 10, { integer: true });
const URL = process.env.URL ?? 'http://127.0.0.1:3000';
const RUNTIME = process.env.RUNTIME ?? 'node';
const RUNTIME_BIN = process.env.RUNTIME_BIN ?? RUNTIME;
const PORT = new globalThis.URL(URL).port || '80';

async function runOne() {
    const server = await startServer({
        bin: RUNTIME_BIN,
        port: PORT,
        url: URL,
    });

    try {
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

        server.assertAlive();

        return result;
    } finally {
        // give srvx the configured 5s grace... but cap at 0.8s for
        // benchmarks, then SIGKILL
        await server.stop('SIGINT', 800);
    }
}

console.log(`runtime=${RUNTIME}  resolver=${process.env.RESOLVER ?? 'linear'}  cache=${process.env.CACHE ?? 'none'}  url=${URL}  trials=${TRIALS} warmup=${WARMUP}s duration=${DURATION}s connections=${CONNECTIONS} pipelining=${PIPELINING}`);

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
