import type { NodeResponse } from '../../bridge';
import { send } from './send';

export function sendCreated(res: NodeResponse, chunk?: any) : Promise<void> {
    res.statusCode = 201;
    res.statusMessage = 'Created';

    return send(res, chunk);
}
