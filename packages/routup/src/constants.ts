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
    OPTIONS = 'options',
    HEAD = 'head',
}

export enum HeaderName {
    ACCEPT = 'accept',
    ACCEPT_CHARSET = 'accept-charset',
    ACCEPT_ENCODING = 'accept-encoding',
    ACCEPT_LANGUAGE = 'accept-language',
    ALLOW = 'allow',
    CACHE_CONTROL = 'cache-control',
    CONTENT_DISPOSITION = 'content-disposition',
    CONTENT_ENCODING = 'content-encoding',
    CONTENT_LENGTH = 'content-length',
    CONTENT_TYPE = 'content-type',
    COOKIE = 'cookie',
    LAST_MODIFIED = 'last-modified',
    LOCATION = 'location',
    SET_COOKIE = 'set-cookie',
}
