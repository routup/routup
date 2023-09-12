import type { NodeResponse } from '../../bridge';
import { setResponseHeaderContentType } from './header-content-type';
import { sendStream } from './send-stream';

export function sendWebBlob(res: NodeResponse, blob: Blob) : Promise<unknown> {
    setResponseHeaderContentType(res, blob.type);

    return sendStream(res, blob.stream());
}
