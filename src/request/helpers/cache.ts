import { HeaderName } from '../../constants';

import type { Request } from '../types';

export function isRequestCacheable(req: Request, modifiedTime: string | Date) : boolean {
    const modifiedSince = req.headers[HeaderName.IF_MODIFIED_SINCE];
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
