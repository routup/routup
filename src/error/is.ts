import { hasInstanceof } from '@ebec/core';
import type { AppError } from './module.ts';
import { ErrorSymbol } from './module.ts';

export function isError(input: unknown) : input is AppError {
    return hasInstanceof(input, ErrorSymbol);
}
