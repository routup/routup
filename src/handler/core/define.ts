import { HandlerType } from '../constants';
import { Handler } from '../module';
import type {
    CoreHandlerConfig,
    CoreHandlerFn,
} from './types';

export function coreHandler(input: Omit<CoreHandlerConfig, | 'type'>) : Handler;

export function coreHandler(input: CoreHandlerFn) : Handler;
export function coreHandler(input: any) : Handler {
    if (typeof input === 'function') {
        return new Handler({
            type: HandlerType.CORE,
            fn: input,
        });
    }

    return new Handler({
        type: HandlerType.CORE,
        ...input,
    });
}
