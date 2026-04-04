import { hasOwnProperty, merge } from 'smob';

import type { DispatchEvent } from '../../dispatcher/event/module.ts';

const envMap = new WeakMap<DispatchEvent, Record<string | symbol, any>>();

export function setRequestEnv(event: DispatchEvent, key: string | symbol, value: unknown) : void;
export function setRequestEnv(event: DispatchEvent, record: Record<string | symbol, any>, append?: boolean) : void;
export function setRequestEnv(event: DispatchEvent, key: Record<string | symbol, any> | string | symbol, value?: boolean | unknown) : void {
    const existing = envMap.get(event);

    if (existing) {
        if (typeof key === 'object') {
            if (value) {
                envMap.set(event, merge(existing, key));
            } else {
                envMap.set(event, key);
            }
        } else {
            existing[key] = value;
            envMap.set(event, existing);
        }

        return;
    }

    if (typeof key === 'object') {
        envMap.set(event, key);
        return;
    }

    envMap.set(event, { [key]: value });
}

export function useRequestEnv(event: DispatchEvent) : Record<string, any>;
export function useRequestEnv(event: DispatchEvent, key: PropertyKey) : unknown | undefined;
export function useRequestEnv(event: DispatchEvent, key?: PropertyKey) {
    const existing = envMap.get(event);
    if (existing) {
        if (typeof key !== 'undefined') {
            return existing[key];
        }

        return existing;
    }

    if (typeof key !== 'undefined') {
        return undefined;
    }

    return {};
}

export function unsetRequestEnv(event: DispatchEvent, key: PropertyKey) {
    const existing = envMap.get(event);
    if (existing && hasOwnProperty(existing, key)) {
        delete existing[key];
    }
}
