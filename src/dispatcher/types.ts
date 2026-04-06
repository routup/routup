import type { RoutupEvent } from '../event/module.ts';

export interface IDispatcher {
    dispatch(event: RoutupEvent): Promise<Response | undefined>;
}
