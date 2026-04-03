import type { DispatchEvent } from '../dispatcher/event/module.ts';
import type { RouterPipelineStep } from './constants.ts';

export type RouterPipelineContext = {
    step: RouterPipelineStep,
    event: DispatchEvent,
    stackIndex: number,
    response?: Response,
};
