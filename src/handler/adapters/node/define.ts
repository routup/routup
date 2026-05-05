import type { IncomingMessage, ServerResponse } from 'node:http';
import type { IRoutupEvent } from '../../../event/index.ts';
import { RoutupError } from '../../../error/module.ts';
import { defineCoreHandler } from '../../core/index.ts';
import type { Handler } from '../../module.ts';
import type { CoreHandler } from '../../core/types.ts';
import type { NodeHandler, NodeMiddleware } from './types.ts';

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
        throw new RoutupError('fromNodeHandler/fromNodeMiddleware expects a function.');
    }

    return defineCoreHandler({
        fn: (async (event: IRoutupEvent) => {
            const node = event.request.runtime?.node;
            if (!node?.req || !node?.res) {
                throw new RoutupError('fromNodeHandler/fromNodeMiddleware requires a Node.js runtime.');
            }

            const req = node.req as unknown as IncomingMessage;
            const res = node.res as unknown as ServerResponse;

            const result = isMiddleware ?
                await callMiddleware(handler as NodeMiddleware, req, res) :
                await callHandler(handler as NodeHandler, req, res);

            if (result === kHandled) {
                return null;
            }

            return event.next();
        }) as CoreHandler,
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
