import type { RoutupError } from '../../error';
import { DispatcherEvent } from './module';

export class DispatcherErrorEvent extends DispatcherEvent {
    override error: RoutupError;
}
