import { isHTTPError } from '@ebec/http';
import { RoutupError } from './module';

export function isError(input: unknown) : input is RoutupError {
    return input instanceof RoutupError || isHTTPError(input);
}
