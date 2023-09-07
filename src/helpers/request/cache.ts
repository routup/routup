import { HeaderName } from '../../constants';
import type { NodeRequest } from '../../type';

export function isRequestCacheable(req: NodeRequest, modifiedTime: string | Date) : boolean {
    const modifiedSince = req.headers[HeaderName.IF_MODIFIED_SINCE];
    if (!modifiedSince) {
        return false;
    }

    modifiedTime = typeof modifiedTime === 'string' ?
        new Date(modifiedTime) :
        modifiedTime;

    return new Date(modifiedSince) >= modifiedTime;
}
