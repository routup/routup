import { HeaderName } from '../../constants.ts';
import { getMimeType } from '../../utils/index.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

export function setResponseHeaderContentType(event: DispatchEvent, input: string, ifNotExists?: boolean) {
    if (ifNotExists) {
        const header = event.response.headers.get(HeaderName.CONTENT_TYPE);
        if (header) {
            return;
        }
    }

    const contentType = getMimeType(input);
    if (contentType) {
        event.response.headers.set(HeaderName.CONTENT_TYPE, contentType);
    }
}
