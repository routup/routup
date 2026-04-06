import { isHTTPError } from '@ebec/http';
import type { RoutupError } from './module';

export function isError(input: unknown) : input is RoutupError {
    return isHTTPError(input);
}
