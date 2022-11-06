/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export enum Method {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    DELETE = 'delete',
}

export enum HeaderName {
    METHOD = 'method',
    URL = 'url',
    STATUS_CODE = 'staus-code',
    STATUS_MESSAGE = 'status-message',

    ACCEPT = 'accept',
    CONTENT_DISPOSITION = 'content-disposition',
    CONTENT_ENCODING = 'content-encoding',
    CONTENT_LENGTH = 'content-length',
    CONTENT_TYPE = 'content-type',
    COOKIE = 'cookie',
}
