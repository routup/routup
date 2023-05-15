export type EtagOptions = {
    /**
     * Create a weak ETag?
     * Output is prefixed with: /W
     */
    weak?: boolean

    /**
     * Threshold of bytes from which an etag is generated.
     *
     * default: undefined
     */
    threshold?: number
};

export type EtagFn = (body: any, encoding?: BufferEncoding, size?: number) => string | undefined;

export type EtagInput = boolean | EtagOptions | EtagFn;
