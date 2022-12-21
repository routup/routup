/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

export function isRegexMatch(input: string, pattern: RegExp | RegExp[]) : boolean {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (let i = 0; i < patterns.length; i++) {
        if (patterns[i].test(input)) {
            return true;
        }
    }

    return false;
}
