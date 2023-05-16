import type { Response } from '../../type';
import { send } from './send';

export function sendCreated(res: Response, chunk?: any) {
    res.statusCode = 201;
    res.statusMessage = 'Created';

    return send(res, chunk);
}