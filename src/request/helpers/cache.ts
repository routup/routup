import { HeaderName } from '../../constants.ts';
import { isNotModifiedSince } from '../../utils/conditional.ts';

import type { IAppEvent } from '../../event/index.ts';

export function isRequestCacheable(event: IAppEvent, modifiedTime: string | Date) : boolean {
    return isNotModifiedSince(event.headers.get(HeaderName.IF_MODIFIED_SINCE), modifiedTime);
}
