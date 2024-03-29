import type { Response } from '../types';
import { send } from './send';

export function sendCreated(res: Response, chunk?: any) : Promise<void> {
    res.statusCode = 201;
    res.statusMessage = 'Created';

    return send(res, chunk);
}
