import type { NodeResponse } from '../../type';
import { send } from './send';

export function sendAccepted(res: NodeResponse, chunk?: any) : Promise<void> {
    res.statusCode = 202;
    res.statusMessage = 'Accepted';

    return send(res, chunk);
}
