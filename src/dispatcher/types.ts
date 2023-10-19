import type { RoutingErrorEvent, RoutingEvent } from '../event';

export interface Dispatcher {
    dispatch(event: RoutingEvent | RoutingErrorEvent) : Promise<void>;
}
