import type { DispatcherEvent } from '../dispatcher';
import type { RouterPipelineStep } from './constants';

export type RouterPipelineContext = {
    step: RouterPipelineStep,
    event: DispatcherEvent,
    stackIndex: number
};
