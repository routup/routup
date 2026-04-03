import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';
import { Handler } from '../module.ts';
import { HandlerType } from '../constants.ts';
import type { CoreHandlerFn } from '../core/types.ts';

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown | Promise<unknown>;
type NodeMiddleware = (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => unknown | Promise<unknown>;

const kHandled = /* @__PURE__ */ Symbol('handled');

function callNodeHandler(
    handler: NodeHandler | NodeMiddleware,
    req: IncomingMessage,
    res: ServerResponse,
): Promise<typeof kHandled | void> {
    const isMiddleware = handler.length > 2;

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
            if (isMiddleware) {
                Promise.resolve(
                    (handler as NodeMiddleware)(req, res, (error) => {
                        if (error) {
                            fail(error);
                        } else {
                            settle(res.writableEnded || res.destroyed ? kHandled : undefined);
                        }
                    }),
                ).catch(fail);
            } else {
                Promise.resolve((handler as NodeHandler)(req, res))
                    .then(() => settle(kHandled))
                    .catch(fail);
            }
        } catch (error) {
            fail(error);
        }
    });
}

/**
 * Wraps a Node.js `(req, res)` handler or `(req, res, next)` middleware
 * for use in the routup pipeline.
 *
 * Uses the native Node.js request/response from srvx's runtime context.
 * Only works when running on Node.js.
 *
 * @example
 * ```typescript
 * import cors from 'cors';
 * import { fromNodeHandler } from 'routup/node';
 *
 * router.use(fromNodeHandler(cors()));
 * ```
 */
export function fromNodeHandler(handler: NodeHandler | NodeMiddleware): Handler {
    if (typeof handler !== 'function') {
        throw new TypeError('fromNodeHandler expects a function.');
    }

    return new Handler({
        type: HandlerType.CORE,
        fn: (async (event: DispatchEvent) => {
            const node = event.request.runtime?.node;
            if (!node?.req || !node?.res) {
                throw new Error('fromNodeHandler requires a Node.js runtime.');
            }

            const result = await callNodeHandler(
                handler,
                node.req as unknown as IncomingMessage,
                node.res as unknown as ServerResponse,
            );

            if (result === kHandled) {
                event.dispatched = true;
            }

            return undefined;
        }) as CoreHandlerFn,
    });
}
