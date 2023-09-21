import { isInstance } from '../utils';
import { RouteSymbol } from './constants';
import type { Route } from './module';

export function isRouteInstance(input: unknown) : input is Route {
    return isInstance(input, RouteSymbol);
}
