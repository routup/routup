import type { RoutupError } from '../../error';
import { DispatchEvent } from './module';

export class DispatchErrorEvent extends DispatchEvent {
    override error: RoutupError;
}
