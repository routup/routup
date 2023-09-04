import { isInstance } from '../utils';
import { Layer } from './module';

export function isLayerInstance(input: unknown) : input is Layer {
    if (input instanceof Layer) {
        return true;
    }

    return isInstance(input, 'Layer');
}
