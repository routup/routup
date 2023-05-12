/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { SwaggerConfigs } from 'swagger-ui-dist';

export type UIOAuthOptions = {
    clientId?: string,
    clientSecret?: string,
    realm?: string,
    appName?: string,
    scopeOperator?: string,
    scopes: string[] | string,
    additionalQueryStringParams?: Record<string, any>,
    useBasicAuthenticationWithAccessCodeGrant?: boolean,
    usePkceWithAuthorizationCodeGrant?: boolean
};

export type UIOptions = SwaggerConfigs & {
    /**
     * OAuth Options
     */
    oauth?: UIOAuthOptions,

    /**
     * Auth action.
     */
    authAction?: Record<string, any>,

    /**
     * The baseUrl defines the base url,
     * where the application is run.
     */
    baseURL?: string,

    /**
     * the basePath defines the path relative to the fqdn
     * on which the application is run.
     */
    basePath?: string,
};
