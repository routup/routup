import type { DispatchEvent } from './event';

export interface Dispatcher {
    dispatch(event: DispatchEvent) : Promise<void>;
}
