import { Response, send } from 'routup';
import {
    DController, DCookie, DCookies,
    DGet, DResponse,
} from '../../src';

@DController('/')
export class CookieController {
    @DGet('many')
    getMany(
    @DResponse() res: Response,
        @DCookies() cookies: Record<string, any>,
    ) {
        send(res, cookies);
    }

    @DGet('single')
    get(
    @DResponse() res: Response,
        @DCookie('foo') foo: string,
    ) {
        send(res, foo);
    }
}
