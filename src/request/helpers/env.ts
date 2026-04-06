import { hasOwnProperty, merge } from 'smob';

import type { IRoutupEvent } from '../../event/index.ts';
import { isObject } from '../../utils/object.ts';

const ENV_KEY = /* @__PURE__ */ Symbol.for('routup:env');

function getEnv(event: IRoutupEvent): Record<string | symbol, any> | undefined {
    return event.context[ENV_KEY] as Record<string | symbol, any> | undefined;
}

function setEnv(event: IRoutupEvent, value: Record<string | symbol, any>): void {
    event.context[ENV_KEY] = value;
}

export function setRequestEnv(event: IRoutupEvent, key: string | symbol, value: unknown) : void;
export function setRequestEnv(event: IRoutupEvent, record: Record<string | symbol, any>, append?: boolean) : void;
export function setRequestEnv(event: IRoutupEvent, key: Record<string | symbol, any> | string | symbol, value?: boolean | unknown) : void {
    const existing = getEnv(event);

    if (existing) {
        if (isObject(key)) {
            if (value) {
                setEnv(event, merge(existing, key));
            } else {
                setEnv(event, key);
            }
        } else {
            existing[key] = value;
        }

        return;
    }

    if (isObject(key)) {
        setEnv(event, key);
        return;
    }

    setEnv(event, { [key]: value });
}

export function useRequestEnv(event: IRoutupEvent) : Record<string, any>;
export function useRequestEnv(event: IRoutupEvent, key: PropertyKey) : unknown | undefined;
export function useRequestEnv(event: IRoutupEvent, key?: PropertyKey) {
    const existing = getEnv(event);
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

export function unsetRequestEnv(event: IRoutupEvent, key: PropertyKey) {
    const existing = getEnv(event);
    if (existing && hasOwnProperty(existing, key)) {
        delete existing[key];
    }
}
