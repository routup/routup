import { describe, expect, it } from 'vitest';
import { DispatchEvent } from '../../../src/dispatcher/event/module';
import { isResponseGone, setResponseGone } from '../../../src/response/helpers/gone';
import { createTestRequest } from '../../helpers';

describe('src/response/helpers/gone', () => {
    it('should return false when not dispatched', () => {
        const event = new DispatchEvent(createTestRequest('/'));
        expect(isResponseGone(event)).toBe(false);
    });

    it('should return true after setResponseGone', () => {
        const event = new DispatchEvent(createTestRequest('/'));
        setResponseGone(event);
        expect(isResponseGone(event)).toBe(true);
    });

    it('should reflect dispatched state', () => {
        const event = new DispatchEvent(createTestRequest('/'));
        event.dispatched = true;
        expect(isResponseGone(event)).toBe(true);
    });
});
