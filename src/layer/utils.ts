import { isInstance } from '../utils';
import { LayerSymbol } from './constants';
import type { Layer } from './module';

export function isLayerInstance(input: unknown) : input is Layer {
    return isInstance(input, LayerSymbol);
}
