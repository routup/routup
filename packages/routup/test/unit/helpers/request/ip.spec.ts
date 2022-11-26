/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {getRequestIp, HeaderName, Request} from "../../../../src";

function createReq (socketAddr: string, headers?: Record<string, any>) : Request {
    return {
        connection: {
            remoteAddress: socketAddr
        },
        headers: headers || {}
    } as Request
}

describe('src/helpers/request/ip', () => {
    it('should determine address', () => {
        let req = createReq('127.0.0.1');
        let ip = getRequestIp(req);
        expect(ip).toEqual('127.0.0.1');

        req = createReq('127.0.0.1', {
            [HeaderName.X_FORWARDED_FOR]: '192.168.0.1, 10.0.0.1'
        })
        ip = getRequestIp(req, { trustProxy: true });
        expect(ip).toEqual('192.168.0.1');

        ip = getRequestIp(req, { trustProxy: false });
        expect(ip).toEqual('127.0.0.1');

        req = createReq('10.0.0.1', {
            [HeaderName.X_FORWARDED_FOR]: '10.0.0.3, 192.168.0.1, 10.0.0.2'
        })
        ip = getRequestIp(req, { trustProxy: (addr) => /^10\./.test(addr) });
        expect(ip).toEqual('192.168.0.1');
    })
})
