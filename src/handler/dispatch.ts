import type { DispatcherEvent } from '../dispatcher';
import { dispatch } from '../dispatcher';
import { HandlerType } from './constants';
import type { Handler } from './types';

export function dispatchToHandler(event: DispatcherEvent, handler: Handler) : Promise<boolean> {
    return dispatch(event, (done) => {
        if (handler.type === HandlerType.ERROR) {
            if (event.meta.error) {
                return handler.fn(event.meta.error, event.req, event.res, done);
            }
        } else {
            return handler.fn(event.req, event.res, done);
        }

        return undefined;
    });
}
