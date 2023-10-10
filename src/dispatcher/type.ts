import type { DispatcherEvent } from './event';

export interface Dispatcher {
    dispatch(event: DispatcherEvent) : Promise<boolean>;
}
