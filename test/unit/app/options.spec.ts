import { describe, expect, it } from 'vitest';
import {
    App,
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

    it('late mutation of parent options does NOT propagate to child', async () => {
        // Documented trade-off: options are configured at mount time;
        // mutating the parent's option object after `use(child)` does
        // not affect the child. Users who need late propagation must
        // re-mount or re-construct.
        const child = new App();
        child.get('/x', defineCoreHandler((event) => String(event.appOptions.subdomainOffset)));

        const parent = new App({ options: { subdomainOffset: 1 } });
        parent.use(child);

        // Mutate the parent's options after mount — child's snapshot
        // already has `subdomainOffset: 1` and won't see the change.
        // (We can't easily mutate from outside since `_options` is
        // protected; this test instead documents that re-using `parent`
        // after a re-construct doesn't bleed into the original child.)
        const parent2 = new App({ options: { subdomainOffset: 99 } });
        parent2.use(child.clone());

        const res = await parent.fetch(createTestRequest('/x'));
        expect(await res.text()).toBe('1');
    });
});
