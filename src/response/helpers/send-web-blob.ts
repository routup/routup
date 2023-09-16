import type { WebBlob } from '../../types';
import type { Response } from '../types';
import { setResponseHeaderContentType } from './header-content-type';
import { sendStream } from './send-stream';

export function sendWebBlob(res: Response, blob: WebBlob) : Promise<unknown> {
    setResponseHeaderContentType(res, blob.type);

    return sendStream(res, blob.stream());
}
