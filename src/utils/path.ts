import type { Path } from '../type';

export function isPath(input: unknown) : input is Path {
    return typeof input === 'string' || input instanceof RegExp;
}
