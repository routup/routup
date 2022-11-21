import {
    DController, DBody, DGet, DResponse,
} from '../../src';
import { Response, send } from "routup";

@DController('/')
export class BodyController {
    @DGet('many')
    getMany(
    @DResponse() res: Response,
        @DBody() body: Record<string, any>,
    ) {
        send(res, body);
    }

    @DGet('single')
    get(
    @DResponse() res: Response,
        @DBody('foo') foo: string,
    ) {
        send(res, foo);
    }
}
