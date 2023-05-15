import type { OutgoingHttpHeader } from 'node:http';
import type { Response } from '../../type';

export function appendResponseHeader(
    res: Response,
    name: string,
    value: OutgoingHttpHeader,
) {
    let header = res.getHeader(name);
    if (!header) {
        res.setHeader(name, value);

        return;
    }

    if (!Array.isArray(header)) {
        header = [header.toString()];
    }

    res.setHeader(name, [...header, value] as readonly string[]);
}

export function appendResponseHeaderDirective(
    res: Response,
    name: string,
    value: OutgoingHttpHeader,
) {
    let header = res.getHeader(name);
    if (!header) {
        if (Array.isArray(value)) {
            res.setHeader(name, value.join('; '));
            return;
        }

        res.setHeader(name, value);
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

    res.setHeader(name, header.join('; '));
}
