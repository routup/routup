import { RoutupError } from './module';

export function isError(input: unknown) : input is RoutupError {
    return input instanceof RoutupError;
}
