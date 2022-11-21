import {
   Response, send,
} from 'routup';
import {  DController, DGet, DResponse, DQuery } from '../../src';

@DController('/')
export class QueryController {
    @DGet('many')
    getMany(
    @DResponse() res: Response,
        @DQuery() query: Record<string, any>,
    ) {
        send(res, query);
    }

    @DGet('single')
    get(
    @DResponse() res: Response,
        @DQuery('foo') foo: string,
    ) {
        send(res, foo);
    }
}
