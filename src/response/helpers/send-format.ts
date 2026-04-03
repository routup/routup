import { getRequestAcceptableContentType } from '../../request/helpers/header-accept.ts';
import type { DispatchEvent } from '../../dispatcher/event/module.ts';

type ResponseFormatHandler = () => Response | unknown;

type ResponseFormats = {
    default: ResponseFormatHandler,
    [key: string]: ResponseFormatHandler,
};

export function sendFormat(event: DispatchEvent, input: ResponseFormats): Response | unknown | undefined {
    const {
        default: formatDefault,
        ...formats
    } = input;

    const contentTypes = Object.keys(formats);

    const contentType = getRequestAcceptableContentType(event, contentTypes);
    if (contentType) {
        return formats[contentType]!();
    }

    return formatDefault();
}
