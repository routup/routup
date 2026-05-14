import { markInstanceof } from '@ebec/core';
import { HTTPError } from '@ebec/http';
import type { HTTPErrorInput } from '@ebec/http';

export type { HTTPErrorInput };

export const ErrorSymbol = Symbol.for('AppError');

export class AppError extends HTTPError {
    constructor(input: HTTPErrorInput = {}) {
        super(input);
        this.name = 'AppError';
        markInstanceof(this, ErrorSymbol);
    }
}
