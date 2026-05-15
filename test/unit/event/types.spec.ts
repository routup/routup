import { 
    describe, 
    expect, 
    expectTypeOf, 
    it, 
} from 'vitest';
import type { MethodName, MethodNameLike } from '../../../src';
import {
    App,
    defineCoreHandler,
} from '../../../src';
import { createTestRequest } from '../../helpers';

/**
 * Type-level locks on the v6 typing surface — these tests catch
 * accidental loosening (back to plain `string` / `Record<string,
 * any>`) that would otherwise pass the runtime suite.
 */
describe('IAppEvent typing', () => {
    it('event.method is typed as MethodNameLike (autocomplete + open-enum)', async () => {
        const app = new App();
        let captured: MethodNameLike | undefined;
        app.get('/x', defineCoreHandler((event) => {
            captured = event.method;
            // Type-level: assignable to MethodNameLike, accepts the
            // canonical methods AND any other string.
            expectTypeOf(event.method).toEqualTypeOf<MethodNameLike>();
            return 'ok';
        }));

        const res = await app.fetch(createTestRequest('/x'));
        expect(res.status).toBe(200);
        // Runtime: the standard methods are uppercase; assert the
        // captured value is in the canonical `MethodName` set.
        expect(captured).toBe('GET');
        const captured2: MethodName = 'GET';
        expect(captured2).toBe(captured);
    });

    it('event.params values are string | undefined', async () => {
        const app = new App();
        let captured: Record<string, string | undefined> | undefined;
        app.get('/users/:id', defineCoreHandler((event) => {
            captured = event.params;
            // Type-level: declared params are string-or-undefined.
            // The undefined accommodates optional params; in this
            // route `id` is mandatory at runtime.
            expectTypeOf(event.params).toEqualTypeOf<Record<string, string | undefined>>();
            return event.params.id ?? '';
        }));

        const res = await app.fetch(createTestRequest('/users/42'));
        expect(await res.text()).toBe('42');
        expect(captured).toEqual({ id: '42' });
    });
});
