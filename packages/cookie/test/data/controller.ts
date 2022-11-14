import {
    DController, DGet, DResponse, Response, send,
} from 'routup';
import { DCookies } from '../../src';

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
        @DCookies('foo') foo: string,
    ) {
        send(res, foo);
    }
}
