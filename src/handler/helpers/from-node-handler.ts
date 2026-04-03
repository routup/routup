import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { Handler } from '../module.ts';
import { HandlerType } from '../constants.ts';
import type { CoreHandlerFn } from '../core/types.ts';

export type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown | Promise<unknown>;
export type NodeMiddleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => unknown | Promise<unknown>;

const kHandled = /* @__PURE__ */ Symbol('handled');

function callHandler(
    handler: NodeHandler,
    req: IncomingMessage,
    res: ServerResponse,
): Promise<typeof kHandled | void> {
    return new Promise((resolve, reject) => {
        let settled = false;

        const onClose = () => settle(kHandled);
        const onFinish = () => settle(kHandled);
        const onError = (error: Error) => fail(error);

        function cleanup() {
            res.removeListener('close', onClose);
            res.removeListener('finish', onFinish);
            res.removeListener('error', onError);
        }

        function settle(value: typeof kHandled | void) {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        }

        function fail(error: unknown) {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        }

        res.once('close', onClose);
        res.once('finish', onFinish);
        res.once('error', onError);

        try {
            Promise.resolve(handler(req, res))
                .then(() => settle(kHandled))
                .catch(fail);
        } catch (error) {
            fail(error);
        }
    });
}

function callMiddleware(
    handler: NodeMiddleware,
    req: IncomingMessage,
    res: ServerResponse,
): Promise<typeof kHandled | void> {
    return new Promise((resolve, reject) => {
        let settled = false;

        const onClose = () => settle(kHandled);
        const onFinish = () => settle(kHandled);
        const onError = (error: Error) => fail(error);

        function cleanup() {
            res.removeListener('close', onClose);
            res.removeListener('finish', onFinish);
            res.removeListener('error', onError);
        }

        function settle(value: typeof kHandled | void) {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        }

        function fail(error: unknown) {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        }

        res.once('close', onClose);
        res.once('finish', onFinish);
        res.once('error', onError);

        try {
            Promise.resolve(
                handler(req, res, (error) => {
                    if (error) {
                        fail(error);
                    } else {
                        settle(res.writableEnded || res.destroyed ? kHandled : undefined);
                    }
                }),
            ).catch(fail);
        } catch (error) {
            fail(error);
        }
    });
}

function createNodeBridge(handler: NodeHandler | NodeMiddleware, isMiddleware: boolean): Handler {
    if (typeof handler !== 'function') {
        throw new TypeError('fromNodeHandler/fromNodeMiddleware expects a function.');
    }

    return new Handler({
        type: HandlerType.CORE,
        fn: (async (event: DispatchEvent) => {
            const node = event.request.runtime?.node;
            if (!node?.req || !node?.res) {
                throw new Error('fromNodeHandler/fromNodeMiddleware requires a Node.js runtime.');
            }

            const req = node.req as unknown as IncomingMessage;
            const res = node.res as unknown as ServerResponse;

            const result = isMiddleware ?
                await callMiddleware(handler as NodeMiddleware, req, res) :
                await callHandler(handler as NodeHandler, req, res);

            if (result === kHandled) {
                event.dispatched = true;
            }

            return undefined;
        }) as CoreHandlerFn,
    });
}

/**
 * Wraps a Node.js `(req, res)` handler for use in the routup pipeline.
 *
 * @example
 * ```typescript
 * import { fromNodeHandler } from 'routup/node';
 *
 * router.use(fromNodeHandler((req, res) => {
 *     res.end('Hello');
 * }));
 * ```
 */
export function fromNodeHandler(handler: NodeHandler): Handler {
    return createNodeBridge(handler, false);
}

/**
 * Wraps a Node.js `(req, res, next)` middleware for use in the routup pipeline.
 *
 * @example
 * ```typescript
 * import cors from 'cors';
 * import { fromNodeMiddleware } from 'routup/node';
 *
 * router.use(fromNodeMiddleware(cors()));
 * ```
 */
export function fromNodeMiddleware(handler: NodeMiddleware): Handler {
    return createNodeBridge(handler, true);
}
