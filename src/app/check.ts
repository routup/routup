import { hasInstanceof } from '@ebec/core';
import { AppSymbol } from './constants.ts';
import type { App } from './module.ts';

export function isAppInstance(input: unknown): input is App {
    return hasInstanceof(input, AppSymbol);
}

