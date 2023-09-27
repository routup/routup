import { HandlerType } from '../constants';
import type {
    CoreHandler,
    CoreHandlerFn,
} from './types';

export function coreHandler(input: Omit<CoreHandler, | 'type'>) : CoreHandler;

export function coreHandler(input: CoreHandlerFn) : CoreHandler;
export function coreHandler(input: any) : CoreHandler {
    if (typeof input === 'function') {
        return {
            type: HandlerType.CORE,
            fn: input,
        };
    }
    return {
        type: HandlerType.CORE,
        ...input,
    };
}
