import { ErrorProxy } from './module';

// todo: rename to isDispatcherError
export function isError(input: unknown) : input is ErrorProxy {
    return input instanceof ErrorProxy;
}
