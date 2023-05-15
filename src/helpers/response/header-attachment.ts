import { HeaderName } from '../../constants';
import type { Response } from '../../type';
import { setResponseContentTypeByFileName } from './utils';

export function setResponseHeaderAttachment(res: Response, filename?: string) {
    if (typeof filename === 'string') {
        setResponseContentTypeByFileName(res, filename);
    }

    res.setHeader(
        HeaderName.CONTENT_DISPOSITION,
        `attachment${filename ? `; filename="${filename}"` : ''}`,
    );
}
