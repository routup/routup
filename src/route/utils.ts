import { isInstance } from '../utils';
import { Route } from './module';

export function isRouteInstance(input: unknown) : input is Route {
    if (input instanceof Route) {
        return true;
    }

    return isInstance(input, 'Route');
}
