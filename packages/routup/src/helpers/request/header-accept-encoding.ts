/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';
import { useRequestNegotiator } from './negotiator';

export function useRequestAcceptsEncodings(req: IncomingMessage) : string[];
export function useRequestAcceptsEncodings(req: IncomingMessage, input: string) : string | undefined;
export function useRequestAcceptsEncodings(req: IncomingMessage, input: string[]) : string | undefined;
export function useRequestAcceptsEncodings(req: IncomingMessage, ...input: string[]) : string | undefined;
export function useRequestAcceptsEncodings(req: IncomingMessage, input?: string | string[]) : string | string[] | undefined {
    input = input || [];
    const items = Array.isArray(input) ? input : [input];

    const negotiator = useRequestNegotiator(req);

    if (items.length === 0) {
        return negotiator.encodings();
    }

    return negotiator.encodings(items).shift() || undefined;
}
