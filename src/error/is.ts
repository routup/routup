import { ErrorProxy } from './module';

export function isError(input: unknown) : input is ErrorProxy {
    return input instanceof ErrorProxy;
}
