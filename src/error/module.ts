import { markInstanceof } from '@ebec/core';
import { HTTPError } from '@ebec/http';
import type { HTTPErrorInput } from '@ebec/http';

export type { HTTPErrorInput };

export const ErrorSymbol = Symbol.for('RoutupError');

export class RoutupError extends HTTPError {
    constructor(input: HTTPErrorInput = {}) {
        super(input);
        this.name = 'RoutupError';
        markInstanceof(this, ErrorSymbol);
    }
}
