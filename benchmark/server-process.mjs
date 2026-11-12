/**
 * Start `benchmark/server.mjs` in a child process and wait until that
 * child answers — never a fixed sleep, so a server that failed to bind
 * cannot let autocannon measure whatever else holds the port.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as wait } from 'node:timers/promises';

const READY_TIMEOUT_MS = 5000;

/** A free ephemeral port on 127.0.0.1. */
export async function getFreePort() {
    const server = createServer();

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    const { port } = server.address();

    await new Promise((resolve) => {
        server.close(resolve);
    });

    return port;
}

/**
 * Spawn the benchmark server on `port` and resolve once `url` answers.
 * The returned `assertAlive()` throws if the child has exited since.
 */
export async function startServer({
    bin = 'node',
    port,
    url,
    env = {},
}) {
    const child = spawn(bin, ['benchmark/server.mjs'], {
        stdio: ['ignore', 'ignore', 'pipe'],
        env: {
            ...process.env,
            ...env,
            PORT: String(port),
        },
    });

    let stderr = '';
    let exit;

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
        stderr += chunk;
    });

    const exited = new Promise((resolve) => {
        child.once('exit', (code, signal) => {
            exit = signal ?? `code ${code}`;
            resolve();
        });
    });

    const fail = (reason) => new Error(`benchmark server (${env.DIST ?? 'dist'}, port ${port}) ${reason}${stderr ? `:\n${stderr}` : ''}`);

    const deadline = Date.now() + READY_TIMEOUT_MS;

    while (true) {
        if (exit !== undefined) {
            throw fail(`exited before it was ready (${exit})`);
        }

        try {
            await fetch(url, { signal: AbortSignal.timeout(500) });

            break;
        } catch {
            // not listening yet
        }

        if (Date.now() > deadline) {
            child.kill('SIGKILL');

            throw fail(`did not answer ${url} within ${READY_TIMEOUT_MS} ms`);
        }

        await Promise.race([wait(50), exited]);
    }

    return {
        child,
        assertAlive() {
            if (exit !== undefined) {
                throw fail(`exited during the measurement (${exit})`);
            }
        },
        async stop(signal = 'SIGKILL', graceMs = 300) {
            if (exit === undefined) {
                child.kill(signal);
                await Promise.race([exited, wait(graceMs)]);
            }

            if (exit !== undefined) {
                return;
            }

            child.kill('SIGKILL');
            await exited;
        },
    };
}
