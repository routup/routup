import { HeaderName } from '../../constants';
import type { WebResponse } from '../../types';
import { splitCookiesString } from '../../utils';
import type { Response } from '../types';
import { sendStream } from './send-stream';

export async function sendWebResponse(res: Response, webResponse: WebResponse) : Promise<void> {
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
        await sendStream(res, webResponse.body);
        return Promise.resolve();
    }

    res.end();

    return Promise.resolve();
}
