import type { Response } from '../../types';
import { EventStream } from './module';

export function createEventStream(response: Response) {
    return new EventStream(response);
}
