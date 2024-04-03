import { hasOwnProperty, merge } from 'smob';
import { getProperty, setProperty } from '../../utils';

import type { Request } from '../types';

const symbol = Symbol.for('ReqEnv');

export function setRequestEnv(req: Request, key: string | symbol, value: unknown) : void;
export function setRequestEnv(req: Request, record: Record<string | symbol, any>, append?: boolean) : void;
export function setRequestEnv(req: Request, key: Record<string | symbol, any> | string | symbol, value?: boolean | unknown) : void {
    const propertyValue = getProperty(req, symbol);

    if (propertyValue) {
        if (typeof key === 'object') {
            if (value) {
                setProperty(req, symbol, merge(propertyValue, key));
            } else {
                setProperty(req, symbol, key);
            }
        } else {
            propertyValue[key] = value;
            setProperty(req, symbol, propertyValue);
        }

        return;
    }

    if (typeof key === 'object') {
        setProperty(req, symbol, key);
        return;
    }

    setProperty(req, symbol, {
        [key]: value,
    });
}

export function useRequestEnv(req: Request) : Record<string, any>;
export function useRequestEnv(req: Request, key: PropertyKey) : unknown | undefined;
export function useRequestEnv(req: Request, key?: PropertyKey) {
    const propertyValue = getProperty(req, symbol);
    if (propertyValue) {
        if (typeof key !== 'undefined') {
            return propertyValue[key];
        }

        return propertyValue;
    }

    if (typeof key !== 'undefined') {
        return undefined;
    }

    return {};
}

export function unsetRequestEnv(req: Request, key: PropertyKey) {
    const propertyValue = getProperty(req, symbol);
    if (hasOwnProperty(propertyValue, key)) {
        delete propertyValue[key];
    }
}
