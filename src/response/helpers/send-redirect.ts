import { RoutupError } from '../../error';
import type { Response } from '../types';
import { send } from './send';

function escapeHtml(str: string) : string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function isAllowedRedirectUrl(location: string) : boolean {
    // Block protocol-relative URLs (e.g. //evil.com)
    if (location.startsWith('//')) {
        return false;
    }

    if (location.startsWith('/') || location.startsWith('.')) {
        return true;
    }

    try {
        const url = new URL(location);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return true;
    }
}

export function sendRedirect(res: Response, location: string, statusCode = 302): Promise<void> {
    if (!isAllowedRedirectUrl(location)) {
        throw new RoutupError({
            statusCode: 400,
            statusMessage: 'Invalid redirect URL scheme.',
        });
    }

    res.statusCode = statusCode;
    res.setHeader('location', location);

    const escapedLoc = escapeHtml(location);
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${escapedLoc}"></head></html>`;

    return send(res, html);
}
