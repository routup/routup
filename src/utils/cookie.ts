/*
  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
  that are within a single set-cookie field-value, such as in the Expires portion.

  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
  React Native's fetch does this for *every* header, including set-cookie.

  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
*/
export function splitCookiesString(input?: string | string[]) : string[] {
    if (Array.isArray(input)) {
        return input.flatMap((el) => splitCookiesString(el));
    }

    if (typeof input !== 'string') {
        return [];
    }

    const cookiesStrings = [];
    let pos = 0;
    let start;
    let ch;
    let lastComma;
    let nextStart;
    let cookiesSeparatorFound;

    const skipWhitespace = () => {
        while (pos < input.length && /\s/.test(input.charAt(pos))) {
            pos += 1;
        }
        return pos < input.length;
    };

    const notSpecialChar = () => {
        ch = input.charAt(pos);

        return ch !== '=' && ch !== ';' && ch !== ',';
    };

    while (pos < input.length) {
        start = pos;
        cookiesSeparatorFound = false;

        while (skipWhitespace()) {
            ch = input.charAt(pos);
            if (ch === ',') {
                // ',' is a cookie separator if we have later first '=', not ';' or ','
                lastComma = pos;
                pos += 1;

                skipWhitespace();
                nextStart = pos;

                while (pos < input.length && notSpecialChar()) {
                    pos += 1;
                }

                // currently special character
                if (pos < input.length && input.charAt(pos) === '=') {
                    // we found cookies separator
                    cookiesSeparatorFound = true;
                    // pos is inside the next cookie, so back up and return it.
                    pos = nextStart;
                    cookiesStrings.push(input.substring(start, lastComma));
                    start = pos;
                } else {
                    // in param ',' or param separator ';',
                    // we continue from that comma
                    pos = lastComma + 1;
                }
            } else {
                pos += 1;
            }
        }

        if (!cookiesSeparatorFound || pos >= input.length) {
            cookiesStrings.push(input.substring(start, input.length));
        }
    }

    return cookiesStrings;
}
