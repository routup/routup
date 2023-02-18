/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import type { Request, Response } from '@routup/core';
import type {
    DefaultMetricsCollectorConfiguration,
    Gauge,
    Histogram,
    HistogramConfiguration,
    LabelValues,
    Registry,
    Summary,
    SummaryConfiguration,
} from 'prom-client';
import type { MetricTypeName } from './constants';

export type Metrics = {
    uptime?: Gauge,
    requestDuration?: Summary | Histogram
};

export type LabelTransformer = (labels: LabelValues<string>, req: Request, res: Response) => void;

export type Options = {
    requestDuration: boolean,
    requestDurationName: string,
    requestDurationLabelTransformer?: LabelTransformer,
    requestDurationLabels?: LabelValues<string>,
    requestDurationType?: `${MetricTypeName}`;
    requestDurationHistogram: Partial<HistogramConfiguration<string>>,
    requestDurationSummary: Partial<SummaryConfiguration<string>>,

    uptime: boolean;
    uptimeName: string,
    uptimeLabels?: LabelValues<string>,

    normalizePath?: ((path: string, req: Request) => string);
    skip: (req: Request) => boolean;

    collectDefaultMetrics?: DefaultMetricsCollectorConfiguration,
    registry: Registry;
};

export type OptionsInput = Partial<Options>;
