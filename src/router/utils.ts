import { isInstance } from '../utils';
import type { Router } from './module';

let nextId = 0;
export function generateRouterID(): number {
    return ++nextId;
}

export function isRouterInstance(input: unknown): input is Router {
    return isInstance(input, 'Router');
}
