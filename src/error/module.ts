import { HTTPError } from '@ebec/http';
import type { HTTPErrorInput } from '@ebec/http';

export type { HTTPErrorInput };

export class RoutupError extends HTTPError {
    constructor(input: HTTPErrorInput = {}) {
        super(input);
        this.name = 'RoutupError';
    }
}
