import { describe, expect, it } from 'vitest';
import {
    App,
    type AppOptions,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * Mount-time option inheritance — child apps fill in any of their
 * unset option keys from the parent at `parent.use(child)` time.
 * After mount, each App's `_options` is its fully resolved view;
 * dispatch reads it directly with no per-request walk.
 *
 * The framework no longer pre-fills defaults at construction or
 * mount; consumer call sites apply their own per-call defaults
 * when an option is undefined (see `request/helpers/*` and
 * `response/to-response.ts`).
 */
describe('App option inheritance (mount-time)', () => {
    it('child inherits parent option set at construction', async () => {
        const child = new App();
        child.get('/x', defineCoreHandler((event) => `offset=${event.appOptions.subdomainOffset}`));

        const parent = new App({ options: { subdomainOffset: 5 } });
        parent.use(child);

        const res = await parent.fetch(createTestRequest('/x'));
        expect(await res.text()).toBe('offset=5');
    });

    it('child option overrides parent', async () => {
        const child = new App({ options: { subdomainOffset: 7 } });
        child.get('/x', defineCoreHandler((event) => `offset=${event.appOptions.subdomainOffset}`));

        const parent = new App({ options: { subdomainOffset: 3 } });
        parent.use(child);

        const res = await parent.fetch(createTestRequest('/x'));
        expect(await res.text()).toBe('offset=7');
    });

    it('grandchild inherits through two mount levels', async () => {
        const grandchild = new App();
        grandchild.get('/x', defineCoreHandler((event) => `offset=${event.appOptions.subdomainOffset}`));

        const child = new App();
        child.use(grandchild);

        const parent = new App({ options: { subdomainOffset: 9 } });
        parent.use(child);

        const res = await parent.fetch(createTestRequest('/x'));
        expect(await res.text()).toBe('offset=9');
    });

    it('sibling apps do not share options', async () => {
        const a = new App({ options: { subdomainOffset: 1 } });
        const b = new App({ options: { subdomainOffset: 2 } });
        a.get('/a', defineCoreHandler((event) => `${event.appOptions.subdomainOffset}`));
        b.get('/b', defineCoreHandler((event) => `${event.appOptions.subdomainOffset}`));

        const parent = new App();
        parent.use('/a', a);
        parent.use('/b', b);

        expect(await (await parent.fetch(createTestRequest('/a/a'))).text()).toBe('1');
        expect(await (await parent.fetch(createTestRequest('/b/b'))).text()).toBe('2');
    });

    it('options are undefined when neither parent nor child set them', async () => {
        const child = new App();
        child.get('/x', defineCoreHandler((event) => String(event.appOptions.subdomainOffset)));

        const parent = new App();
        parent.use(child);

        const res = await parent.fetch(createTestRequest('/x'));
        // No framework default at the App level — consumer-site code
        // is responsible for falling back. Reading the raw option
        // returns undefined.
        expect(await res.text()).toBe('undefined');
    });

    it('parent _options is frozen — late mutation throws (and would not propagate)', async () => {
        // Two guarantees in one test:
        //   1. `_options` is `Object.freeze`d, so any attempt to mutate
        //      a parent's resolved options after construction raises a
        //      TypeError in strict mode (which spec files run in).
        //   2. The child snapshot it propagated at mount time is its
        //      own object, so even if a mutation *were* to land on the
        //      parent, the child would not see it.
        const child = new App();
        child.get('/x', defineCoreHandler((event) => String(event.appOptions.subdomainOffset)));

        const parent = new App({ options: { subdomainOffset: 1 } });
        parent.use(child);

        // Reach past the type-level `Readonly<AppOptions>` guard to
        // prove the runtime freeze is in place. Without the freeze
        // this assignment would silently land on the live App-global
        // object and bleed into every future request.
        expect(() => {
            (parent as unknown as { _options: AppOptions })._options.subdomainOffset = 99;
        }).toThrow(TypeError);

        const res = await parent.fetch(createTestRequest('/x'));
        expect(await res.text()).toBe('1');
    });
});
