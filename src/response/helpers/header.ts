import type { OutgoingHttpHeader } from 'node:http';

import { sanitizeHeaderValue } from '../../utils';
import type { Response } from '../types';

export function appendResponseHeader(
    res: Response,
    name: string,
    value: OutgoingHttpHeader,
) {
    let header = res.getHeader(name);
    if (!header) {
        if (Array.isArray(value)) {
            res.setHeader(
                name,
                value.map((v) => sanitizeHeaderValue(`${v}`)) as readonly string[],
            );
        } else {
            res.setHeader(name, sanitizeHeaderValue(`${value}`));
        }

        return;
    }

    if (!Array.isArray(header)) {
        header = [header.toString()];
    }

    res.setHeader(name, [...header, value].map(
        (v) => sanitizeHeaderValue(`${v}`),
    ) as readonly string[]);
}

export function appendResponseHeaderDirective(
    res: Response,
    name: string,
    value: OutgoingHttpHeader,
) {
    let header = res.getHeader(name);
    if (!header) {
        if (Array.isArray(value)) {
            res.setHeader(name, sanitizeHeaderValue(value.join('; ')));
            return;
        }

        res.setHeader(name, sanitizeHeaderValue(`${value}`));
        return;
    }

    if (!Array.isArray(header)) {
        if (typeof header === 'string') {
            // split header by directive(s)
            header = header.split('; ');
        }

        if (typeof header === 'number') {
            header = [header.toString()];
        }
    }

    if (Array.isArray(value)) {
        header.push(...value);
    } else {
        header.push(`${value}`);
    }

    header = [...new Set(header)];

    res.setHeader(name, sanitizeHeaderValue(header.join('; ')));
}
