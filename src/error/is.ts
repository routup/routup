import { isHTTPError } from '@ebec/http';
import type { RoutupError } from './module.ts';

export function isError(input: unknown) : input is RoutupError {
    if (!isHTTPError(input)) {
        return false;
    }

    return (input as unknown as { name?: string }).name === 'RoutupError';
}
