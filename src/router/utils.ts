import { isInstance } from '../utils';
import { RouterPipelineStep, RouterSymbol } from './constants';
import type { Router } from './module';

let nextId = 0;
export function generateRouterID(): number {
    return ++nextId;
}

export function isRouterInstance(input: unknown): input is Router {
    return isInstance(input, RouterSymbol);
}

export function isRouterPipelineStepValid(step: number) {
    return step <= RouterPipelineStep.FINISH;
}
