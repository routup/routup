import type { Response } from '../types';
import { send } from './send';

export function sendAccepted(res: Response, chunk?: any) : Promise<void> {
    res.statusCode = 202;
    res.statusMessage = 'Accepted';

    return send(res, chunk);
}
