import type { Response } from '../../type';
import { getRequestAcceptableContentType } from '../request';

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
