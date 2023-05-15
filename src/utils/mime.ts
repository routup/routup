import { get, getType } from 'mime-explorer';

export function getMimeType(type: string) : string | undefined {
    if (type.indexOf('/') !== -1) {
        return type;
    }

    return getType(type);
}

export function getCharsetForMimeType(type: string) : string | undefined {
    if ((/^text\/|^application\/(javascript|json)/).test(type)) {
        return 'utf-8';
    }

    const meta = get(type);
    if (
        meta &&
        meta.charset
    ) {
        return meta.charset.toLowerCase();
    }

    return undefined;
}
