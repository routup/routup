import type { DispatchEvent } from '../dispatcher';
import type { RouterPipelineStep } from './constants';

export type RouterPipelineContext = {
    step: RouterPipelineStep,
    event: DispatchEvent,
    stackIndex: number
};
