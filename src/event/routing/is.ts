import type { RoutingErrorEvent, RoutingEvent } from './types';

export function isRoutingEvent(input: RoutingEvent | RoutingErrorEvent) : input is RoutingEvent {
    return typeof input.error === 'undefined';
}

export function isRoutingErrorEvent(input: RoutingEvent | RoutingErrorEvent) : input is RoutingErrorEvent {
    return typeof input.error !== 'undefined';
}
