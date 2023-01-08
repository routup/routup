/*
 * Copyright (c) 2023.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export enum MetricTypeName {
    HISTOGRAM = 'histogram',

    SUMMARY = 'summary',
}

export enum MetricName {
    REQUEST_DURATION = 'http_request_duration',
    UPTIME = 'http_uptime',
}
