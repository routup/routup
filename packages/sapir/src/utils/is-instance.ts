/*
 * Copyright (c) 2022-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export function isInstance(input: unknown, name: string) {
    return (
        typeof input === 'object' &&
        input !== null &&
        (input as { '@instanceof': symbol })['@instanceof'] === Symbol.for(name)
    );
}
