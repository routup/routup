import type { NodeResponse } from '../../bridge';
import { HeaderName } from '../../constants';
import { setResponseContentTypeByFileName } from './utils';

export function setResponseHeaderAttachment(res: NodeResponse, filename?: string) {
    if (typeof filename === 'string') {
        setResponseContentTypeByFileName(res, filename);
    }

    res.setHeader(
        HeaderName.CONTENT_DISPOSITION,
        `attachment${filename ? `; filename="${filename}"` : ''}`,
    );
}
