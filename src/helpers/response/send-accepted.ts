import type { NodeResponse } from '../../bridge';
import { send } from './send';

export function sendAccepted(res: NodeResponse, chunk?: any) : Promise<void> {
    res.statusCode = 202;
    res.statusMessage = 'Accepted';

    return send(res, chunk);
}
