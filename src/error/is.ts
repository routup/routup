import { hasInstanceof } from '@ebec/core';
import type { RoutupError } from './module.ts';
import { ErrorSymbol } from './module.ts';

export function isError(input: unknown) : input is RoutupError {
    return hasInstanceof(input, ErrorSymbol);
}
