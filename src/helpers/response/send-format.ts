import type { NodeResponse } from '../../bridge';
import { getRequestAcceptableContentType } from '../request';

type ResponseFormats = {
    default: () => void,
    [key: string]: () => void
};

export function sendFormat(res: NodeResponse, input: ResponseFormats) {
    const { default: formatDefault, ...formats } = input;

    const contentTypes = Object.keys(formats);

    const contentType = getRequestAcceptableContentType(res.req, contentTypes);
    if (contentType) {
        formats[contentType]();

        return;
    }

    formatDefault();
}
