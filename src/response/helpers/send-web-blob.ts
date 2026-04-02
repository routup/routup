import type { WebBlob } from '../../types';
import type { Response } from '../types';
import { setResponseHeaderContentType } from './header-content-type';
import { sendStream } from './send-stream';

const VALID_MIME_TYPE = /^[\w-]+\/[\w+.-]+$/;

export async function sendWebBlob(res: Response, blob: WebBlob) : Promise<void> {
    const mimeType = blob.type && VALID_MIME_TYPE.test(blob.type) ?
        blob.type :
        'application/octet-stream';

    setResponseHeaderContentType(res, mimeType);

    await sendStream(res, blob.stream());
}
