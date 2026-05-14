import { HeaderName } from '../../constants.ts';
import type { IAppEvent } from '../../event/index.ts';
import { setResponseContentTypeByFileName } from './utils.ts';

// eslint-disable-next-line no-control-regex
const ENCODE_URL_ATTR_CHAR_REGEXP = /[\x00-\x20"'()*,/:;<=>?@[\\\]{}\x7f]/g;
const NON_ASCII_REGEXP = /[^\x20-\x7e]/g;
const QUOTE_REGEXP = /[\\"]/g;
const HEX_ESCAPE_REGEXP = /%[0-9A-Fa-f]{2}/;
const ASCII_TEXT_REGEXP = /^[\x20-\x7e]+$/;
const TOKEN_REGEXP = /^[!#$%&'*+.0-9A-Z^_`a-z|~-]+$/;

function pencode(char: string): string {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
}

function quoteString(value: string): string {
    return `"${value.replace(QUOTE_REGEXP, '\\$&')}"`;
}

function getAscii(value: string): string {
    return value.replace(NON_ASCII_REGEXP, '?');
}

function encodeExtended(value: string): string {
    return encodeURIComponent(value).replace(ENCODE_URL_ATTR_CHAR_REGEXP, pencode);
}

function formatFilename(value: string): string {
    if (TOKEN_REGEXP.test(value)) {
        return `filename=${value}`;
    }
    return `filename=${quoteString(value)}`;
}

function setDisposition(
    event: IAppEvent,
    type: 'attachment' | 'inline',
    filename?: string,
) {
    let disposition: string = type;

    if (typeof filename === 'string') {
        setResponseContentTypeByFileName(event, filename);

        const isAsciiSafe = ASCII_TEXT_REGEXP.test(filename) &&
            !HEX_ESCAPE_REGEXP.test(filename);

        if (isAsciiSafe) {
            disposition += `; ${formatFilename(filename)}`;
        } else {
            disposition += `; ${formatFilename(getAscii(filename))}`;
            disposition += `; filename*=UTF-8''${encodeExtended(filename)}`;
        }
    }

    event.response.headers.set(
        HeaderName.CONTENT_DISPOSITION,
        disposition,
    );
}

export function setResponseHeaderAttachment(event: IAppEvent, filename?: string) {
    setDisposition(event, 'attachment', filename);
}

export function setResponseHeaderInline(event: IAppEvent, filename?: string) {
    setDisposition(event, 'inline', filename);
}
