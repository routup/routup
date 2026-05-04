type ParsedVersion = {
    major: number,
    minor: number,
    patch: number,
    prerelease: string[] | undefined,
};

function parseVersion(version: string): ParsedVersion | undefined {
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?(?:\+.+)?$/);
    if (!match) {
        return undefined;
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        prerelease: match[4] ? match[4].split('.') : undefined,
    };
}

function comparePrereleaseIdentifiers(a: string[], b: string[]): number {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (i >= a.length) return -1; // shorter array has lower precedence
        if (i >= b.length) return 1;

        const aId = a[i]!;
        const bId = b[i]!;
        const aNum = /^\d+$/.test(aId) ? Number(aId) : undefined;
        const bNum = /^\d+$/.test(bId) ? Number(bId) : undefined;

        // both numeric: compare numerically
        if (aNum !== undefined && bNum !== undefined) {
            if (aNum !== bNum) return aNum - bNum;
            continue;
        }

        // numeric < non-numeric
        if (aNum !== undefined) return -1;
        if (bNum !== undefined) return 1;

        // both non-numeric: compare lexically
        if (aId < bId) return -1;
        if (aId > bId) return 1;
    }

    return 0;
}

function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    if (a.patch !== b.patch) return a.patch - b.patch;

    // no prerelease > prerelease
    if (!a.prerelease && b.prerelease) return 1;
    if (a.prerelease && !b.prerelease) return -1;
    if (a.prerelease && b.prerelease) {
        return comparePrereleaseIdentifiers(a.prerelease, b.prerelease);
    }

    return 0;
}

/**
 * Check if a version satisfies a semver constraint.
 *
 * Supported constraint formats:
 * - Exact: '1.2.3'
 * - Comparison: '>=1.0.0', '>1.0.0', '<=2.0.0', '<2.0.0', '=1.0.0'
 * - Caret: '^1.2.3' (>=1.2.3 <2.0.0)
 * - Tilde: '~1.2.3' (>=1.2.3 <1.3.0)
 */
export function satisfiesVersion(version: string, constraint: string): boolean {
    const parsed = parseVersion(version);
    if (!parsed) {
        return false;
    }

    const parts = constraint.trim().split(/\s+/);
    return parts.every((part) => satisfiesSingle(parsed, part));
}

function satisfiesSingle(version: ParsedVersion, constraint: string): boolean {
    if (constraint.startsWith('^')) {
        return satisfiesCaret(version, constraint.substring(1));
    }

    if (constraint.startsWith('~')) {
        return satisfiesTilde(version, constraint.substring(1));
    }

    if (constraint.startsWith('>=')) {
        const target = parseVersion(constraint.substring(2));
        return !!target && compareVersions(version, target) >= 0;
    }

    if (constraint.startsWith('>')) {
        const target = parseVersion(constraint.substring(1));
        return !!target && compareVersions(version, target) > 0;
    }

    if (constraint.startsWith('<=')) {
        const target = parseVersion(constraint.substring(2));
        return !!target && compareVersions(version, target) <= 0;
    }

    if (constraint.startsWith('<')) {
        const target = parseVersion(constraint.substring(1));
        return !!target && compareVersions(version, target) < 0;
    }

    if (constraint.startsWith('=')) {
        const target = parseVersion(constraint.substring(1));
        return !!target && compareVersions(version, target) === 0;
    }

    // Exact match
    const target = parseVersion(constraint);
    return !!target && compareVersions(version, target) === 0;
}

/**
 * When the version under test has a prerelease tag, it only matches if it
 * shares the same [major, minor, patch] tuple as the range's lower bound.
 * This follows npm semver semantics where prereleases are scoped to their
 * exact version tuple.
 */
function prereleaseAllowed(version: ParsedVersion, min: ParsedVersion): boolean {
    if (!version.prerelease) {
        return true;
    }

    return version.major === min.major &&
        version.minor === min.minor &&
        version.patch === min.patch;
}

function satisfiesCaret(version: ParsedVersion, range: string): boolean {
    const min = parseVersion(range);
    if (!min) return false;

    if (compareVersions(version, min) < 0) return false;

    if (version.prerelease && !prereleaseAllowed(version, min)) {
        return false;
    }

    // ^1.2.3 → <2.0.0 (major must match for major > 0)
    // ^0.2.3 → <0.3.0 (minor must match for major === 0, minor > 0)
    // ^0.0.3 → =0.0.3 (exact for 0.0.x)
    if (min.major > 0) {
        return version.major === min.major;
    }

    if (min.minor > 0) {
        return version.major === 0 && version.minor === min.minor;
    }

    return version.major === 0 && version.minor === 0 && version.patch === min.patch;
}

function satisfiesTilde(version: ParsedVersion, range: string): boolean {
    const min = parseVersion(range);
    if (!min) return false;

    if (compareVersions(version, min) < 0) return false;

    if (version.prerelease && !prereleaseAllowed(version, min)) {
        return false;
    }

    // ~1.2.3 → >=1.2.3 <1.3.0
    return version.major === min.major && version.minor === min.minor;
}
