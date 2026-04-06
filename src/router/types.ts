import type { IDispatcher } from '../dispatcher/index.ts';
import type { RoutupEvent, RoutupRequest } from '../event/index.ts';
import type { Handler, HandlerConfig } from '../handler/index.ts';
import type {
    HookDefaultListener,
    HookErrorListener,
    HookListener,
    HookName,
    HookUnsubscribeFn,
} from '../hook/index.ts';

import type { Path } from '../path/index.ts';
import type { Plugin } from '../plugin/index.ts';
import type { RouterPipelineStep } from './constants.ts';

export type RouterPipelineContext = {
    step: RouterPipelineStep,
    event: RoutupEvent,
    stackIndex: number,
    response?: Response,
};

export interface IRouter extends IDispatcher {
    /**
     * Unique identifier for this router instance.
     */
    readonly id: number;

    /**
     * Optional label for the router instance.
     */
    readonly name?: string;

    /**
     * Public entry point — processes a request through the pipeline
     * and returns a Response (with 404/500 fallbacks).
     */
    fetch(request: RoutupRequest): Promise<Response>;

    /**
     * Test if a path matches this router's mount path.
     */
    matchPath(path: string): boolean;

    /**
     * Set or clear the router's mount path.
     */
    setPath(value?: Path): void;

    /**
     * Register a handler, router, or plugin.
     * When a path is provided, the item is mounted at that path.
     */
    use(router: IRouter): this;
    use(handler: Handler | HandlerConfig): this;
    use(plugin: Plugin): this;
    use(path: Path, router: IRouter): this;
    use(path: Path, handler: Handler | HandlerConfig): this;
    use(path: Path, plugin: Plugin): this;

    /** Register GET handler(s). */
    get(...handlers: (Handler | HandlerConfig)[]): this;
    get(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /** Register POST handler(s). */
    post(...handlers: (Handler | HandlerConfig)[]): this;
    post(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /** Register PUT handler(s). */
    put(...handlers: (Handler | HandlerConfig)[]): this;
    put(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /** Register PATCH handler(s). */
    patch(...handlers: (Handler | HandlerConfig)[]): this;
    patch(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /** Register DELETE handler(s). */
    delete(...handlers: (Handler | HandlerConfig)[]): this;
    delete(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /** Register HEAD handler(s). */
    head(...handlers: (Handler | HandlerConfig)[]): this;
    head(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /** Register OPTIONS handler(s). */
    options(...handlers: (Handler | HandlerConfig)[]): this;
    options(path: Path, ...handlers: (Handler | HandlerConfig)[]): this;

    /**
     * Mount an external fetch handler at the given path.
     * The handler receives requests with the mount prefix stripped from the URL.
     *
     * @experimental
     */
    mount(path: Path, handler: { fetch: (request: Request) => Response | Promise<Response> }): this;
    mount(path: Path, handler: (request: Request) => Response | Promise<Response>): this;

    /**
     * Add a hook listener.
     */
    on(
        name: `${HookName.REQUEST}` |
            `${HookName.RESPONSE}` |
            `${HookName.CHILD_DISPATCH_BEFORE}` |
            `${HookName.CHILD_DISPATCH_AFTER}`,
        fn: HookDefaultListener,
    ): HookUnsubscribeFn;
    on(
        name: `${HookName.CHILD_MATCH}`,
        fn: HookDefaultListener,
    ): HookUnsubscribeFn;
    on(
        name: `${HookName.ERROR}`,
        fn: HookErrorListener,
    ): HookUnsubscribeFn;

    /**
     * Remove a specific or all hook listeners for the given hook name.
     */
    off(name: `${HookName}`): this;
    off(name: `${HookName}`, fn: HookListener): this;
}
