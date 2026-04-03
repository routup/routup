import { RoutupError } from '../../error/module.ts';
import { sanitizeHeaderValue } from '../../utils/index.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

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

export function sendRedirect(event: DispatchEvent, location: string, statusCode = 302): Response {
    if (!isAllowedRedirectUrl(location)) {
        throw new RoutupError({
            statusCode: 400,
            statusMessage: 'Invalid redirect URL scheme.',
        });
    }

    const sanitizedLocation = sanitizeHeaderValue(location);
    const escapedLoc = escapeHtml(location);
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${escapedLoc}"></head></html>`;

    event.dispatched = true;

    return new Response(html, {
        status: statusCode,
        headers: {
            'location': sanitizedLocation,
            'content-type': 'text/html; charset=utf-8',
        },
    });
}
