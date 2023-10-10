import type { WebBlob } from '../../types';
import type { Response } from '../types';
import { setResponseHeaderContentType } from './header-content-type';
import { sendStream } from './send-stream';

export async function sendWebBlob(res: Response, blob: WebBlob) : Promise<void> {
    setResponseHeaderContentType(res, blob.type);

    await sendStream(res, blob.stream());
}
