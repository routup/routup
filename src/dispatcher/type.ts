import type { DispatchEvent } from './event/module.ts';

export interface Dispatcher {
    dispatch(event: DispatchEvent): Promise<Response | undefined>;
}
