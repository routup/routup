import { MimeExplorer } from 'mime-explorer';
import db from 'mime-explorer/db';

let instance : MimeExplorer | undefined;

// built on first use, so the database stays tree-shakeable for consumers without mime helpers
function useMimeExplorer() : MimeExplorer {
    instance ??= new MimeExplorer(db);

    return instance;
}

export function getMimeType(type: string) : string | undefined {
    if (type.includes('/')) {
        return type;
    }

    return useMimeExplorer().getType(type);
}

export function getCharsetForMimeType(type: string) : string | undefined {
    if ((/^text\/|^application\/(javascript|json)/).test(type)) {
        return 'utf-8';
    }

    const meta = useMimeExplorer().getMeta(type);

    if (
        meta &&
        meta.charset
    ) {
        return meta.charset.toLowerCase();
    }

    return undefined;
}
