import { getRequestAcceptableContentType } from '../../request/helpers/header-accept.ts';
import type { IAppEvent } from '../../event/index.ts';

type ResponseFormatHandler = () => Response | unknown;

type ResponseFormats = {
    default: ResponseFormatHandler,
    [key: string]: ResponseFormatHandler,
};

export function sendFormat(event: IAppEvent, input: ResponseFormats): Response | unknown | undefined {
    const {
        default: formatDefault,
        ...formats
    } = input;

    const contentTypes = Object.keys(formats);

    if (contentTypes.length === 0) {
        return formatDefault();
    }

    const contentType = getRequestAcceptableContentType(event, contentTypes);
    if (contentType && formats[contentType]) {
        return formats[contentType]();
    }

    return formatDefault();
}
