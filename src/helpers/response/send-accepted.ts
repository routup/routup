import type { Response } from '../../type';
import { send } from './send';

export function sendAccepted(res: Response, chunk?: any) {
    res.statusCode = 202;
    res.statusMessage = 'Accepted';

    return send(res, chunk);
}