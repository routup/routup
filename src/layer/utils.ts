import { isInstance } from '../utils';
import type { Layer } from './module';

export function isLayerInstance(input: unknown) : input is Layer {
    return isInstance(input, 'Layer');
}
