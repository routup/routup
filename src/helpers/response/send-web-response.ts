import type { NodeResponse } from '../../bridge';
import { HeaderName } from '../../constants';
import { splitCookiesString } from '../../utils';
import { sendStream } from './send-stream';

export function sendWebResponse(res: NodeResponse, webResponse: Response) : Promise<unknown> {
    if (webResponse.redirected) {
        res.setHeader(HeaderName.LOCATION, webResponse.url);
    }

    if (webResponse.status) {
        res.statusCode = webResponse.status;
    }

    if (webResponse.statusText) {
        res.statusMessage = webResponse.statusText;
    }

    webResponse.headers.forEach((value, key) => {
        if (key === HeaderName.SET_COOKIE) {
            res.appendHeader(key, splitCookiesString(value));
        } else {
            res.setHeader(key, value);
        }
    });

    if (webResponse.body) {
        return sendStream(res, webResponse.body);
    }

    res.end();

    return Promise.resolve();
}
