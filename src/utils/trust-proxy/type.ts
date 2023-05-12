/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export type TrustProxyFn = (address: string, hop: number) => boolean;

export type TrustProxyInput = boolean | number | string | string[] | TrustProxyFn;
