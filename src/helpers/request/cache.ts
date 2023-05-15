import { HeaderName } from '../../constants';
import type { Request } from '../../type';

export function isRequestCacheable(req: Request, modifiedTime: string | Date) : boolean {
    const modifiedSince = req.headers[HeaderName.IF_MODIFIED_SINCE];
    if (!modifiedSince) {
        return false;
    }

    modifiedTime = typeof modifiedTime === 'string' ?
        new Date(modifiedTime) :
        modifiedTime;

    return new Date(modifiedSince) >= modifiedTime;
}
