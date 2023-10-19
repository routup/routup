import type { RoutingErrorEvent, RoutingEvent } from '../event';
import type { Handler } from '../handler';
import type { RouterPipelineStep } from './constants';
import type { Router } from './module';

export type RouterPipelineContext = {
    id: `${RouterPipelineStep}`,
    event: RoutingEvent | RoutingErrorEvent,
    index?: number,
    handler?: Handler,
    router?: Router
};
