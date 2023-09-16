import { getRequestAcceptableContentType } from '../../request/helpers';
import type { Response } from '../types';

type ResponseFormats = {
    default: () => void,
    [key: string]: () => void
};

export function sendFormat(res: Response, input: ResponseFormats) {
    const { default: formatDefault, ...formats } = input;

    const contentTypes = Object.keys(formats);

    const contentType = getRequestAcceptableContentType(res.req, contentTypes);
    if (contentType) {
        formats[contentType]();

        return;
    }

    formatDefault();
}
