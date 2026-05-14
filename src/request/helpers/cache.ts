import { HeaderName } from '../../constants.ts';

import type { IAppEvent } from '../../event/index.ts';

export function isRequestCacheable(event: IAppEvent, modifiedTime: string | Date) : boolean {
    const modifiedSince = event.headers.get(HeaderName.IF_MODIFIED_SINCE);
    if (!modifiedSince) {
        return false;
    }

    modifiedTime = typeof modifiedTime === 'string' ?
        new Date(modifiedTime) :
        modifiedTime;

    const sinceDate = new Date(modifiedSince);
    if (Number.isNaN(sinceDate.getTime()) || Number.isNaN(modifiedTime.getTime())) {
        return false;
    }

    return sinceDate >= modifiedTime;
}
