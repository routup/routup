import type { RoutupError } from '../../error';
import { DispatchEvent } from './module';

export class DispatchErrorEvent extends DispatchEvent {
    // @ts-expect-error @typescript-eslint/ban-ts-comment
    override error: RoutupError;
}
