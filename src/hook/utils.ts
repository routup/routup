import { HookName } from './constants';

export function isHookForErrorListener(
    input: `${HookName}`,
) : boolean {
    return input === HookName.ERROR ||
        input === HookName.DISPATCH_FAIL;
}

export function isHookForMatchListener(
    input: `${HookName}`,
) : boolean {
    return input === HookName.MATCH;
}

export function isHookForDefaultListener(
    input: `${HookName}`,
) : boolean {
    return !isHookForErrorListener(input) &&
        !isHookForMatchListener(input);
}
