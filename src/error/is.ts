import { isHTTPError } from '@ebec/http';
import { isInstance } from '../utils/index.ts';
import type { RoutupError } from './module.ts';
import { ErrorSymbol } from './module.ts';

export function isError(input: unknown) : input is RoutupError {
    if (!isHTTPError(input)) {
        return false;
    }

    return isInstance(input, ErrorSymbol);
}
