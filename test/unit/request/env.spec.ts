import { describe, expect, it } from 'vitest';
import { RoutupEvent } from '../../../src/event/module';
import {
    setRequestEnv,
    unsetRequestEnv,
    useRequestEnv,
} from '../../../src';
import { createTestRequest } from '../../helpers';

describe('src/helpers/request/env', () => {
    it('should set & get env param', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        setRequestEnv(event, 'bar', 'baz');
        setRequestEnv(event, 'foo', 'bar');

        expect(useRequestEnv(event, 'foo')).toEqual('bar');
    });

    it('should set & get env object', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        setRequestEnv(event, {
            foo: 'bar',
            bar: 'baz',
        });

        expect(useRequestEnv(event)).toEqual({
            foo: 'bar',
            bar: 'baz',
        });
    });

    it('should append env to request', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        setRequestEnv(event, { foo: 'bar' });
        setRequestEnv(event, { bar: 'baz' }, true);

        expect(useRequestEnv(event)).toEqual({
            foo: 'bar',
            bar: 'baz',
        });
    });

    it('should overwrite env of request', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        setRequestEnv(event, { foo: 'bar' });
        setRequestEnv(event, { bar: 'baz' });

        expect(useRequestEnv(event)).toEqual({ bar: 'baz' });
    });

    it('should unset env of request', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        setRequestEnv(event, {
            foo: 'bar',
            bar: 'baz',
        });

        unsetRequestEnv(event, 'foo');

        expect(useRequestEnv(event)).toEqual({ bar: 'baz' });
    });

    it('should use request env', () => {
        const event = new RoutupEvent(createTestRequest('/'));

        expect(useRequestEnv(event)).toEqual({});
    });
});
