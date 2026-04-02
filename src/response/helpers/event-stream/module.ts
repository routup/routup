import { PassThrough } from 'readable-stream';
import { HeaderName } from '../../../constants';
import { isRequestHTTP2 } from '../../../request';
import type { Response } from '../../types';
import { setResponseGone } from '../gone';
import type { EventStreamListener, EventStreamMessage } from './types';
import { serializeEventStreamMessage } from './utils';

export type EventStreamOptions = {
    maxMessageSize?: number,
    maxListeners?: number,
};

export class EventStream {
    protected response: Response;

    protected passThrough : PassThrough;

    protected flushed : boolean;

    protected eventHandlers : Record<string, EventStreamListener[]>;

    protected maxMessageSize? : number;

    protected maxListeners? : number;

    constructor(response: Response, options?: EventStreamOptions) {
        this.response = response;

        this.passThrough = new PassThrough({ encoding: 'utf-8' });

        this.flushed = false;

        this.eventHandlers = {};

        this.maxMessageSize = options?.maxMessageSize;
        this.maxListeners = options?.maxListeners;

        this.open();
    }

    protected open() {
        this.response.req.on('close', () => this.end());
        this.response.req.on('error', (err) => {
            this.emit('error', err);
            this.end();
        });

        this.passThrough.on('data', (chunk) => this.response.write(chunk));
        this.passThrough.on('error', (err) => {
            this.emit('error', err);
            this.end();
        });
        this.passThrough.on('close', () => this.end());

        this.response.setHeader(
            HeaderName.CONTENT_TYPE,
            'text/event-stream',
        );
        this.response.setHeader(
            HeaderName.CACHE_CONTROL,
            'private, no-cache, no-store, no-transform, must-revalidate, max-age=0',
        );
        this.response.setHeader(
            HeaderName.X_ACCEL_BUFFERING,
            'no',
        );

        if (!isRequestHTTP2(this.response.req)) {
            this.response.setHeader(
                HeaderName.CONNECTION,
                'keep-alive',
            );
        }

        this.response.statusCode = 200;
    }

    write(message: EventStreamMessage) : void;

    write(message: string) : void;

    write(message: string | EventStreamMessage) : void {
        if (typeof message === 'string') {
            this.write({ data: message });
            return;
        }

        const serialized = serializeEventStreamMessage(message);

        if (this.maxMessageSize && serialized.length > this.maxMessageSize) {
            this.emit('error', new Error(
                `SSE message size (${serialized.length}) exceeds limit (${this.maxMessageSize}).`,
            ));
            return;
        }

        if (
            !this.passThrough.closed &&
            this.passThrough.writable
        ) {
            this.passThrough.write(serialized);
        }
    }

    end() {
        if (this.flushed) return;

        this.flushed = true;

        if (!this.passThrough.closed) {
            this.passThrough.end();
        }

        this.emit('close');

        setResponseGone(this.response, true);

        this.response.end();
    }

    on(event: 'close', listener: EventStreamListener) : void;

    on(event: 'error', listener: EventStreamListener) : void;

    on(event: string, listener: EventStreamListener) : void {
        if (typeof this.eventHandlers[event] === 'undefined') {
            this.eventHandlers[event] = [];
        }

        if (this.maxListeners) {
            const totalListeners = Object.values(this.eventHandlers)
                .reduce((sum, handlers) => sum + handlers.length, 0);

            if (totalListeners >= this.maxListeners) {
                return;
            }
        }

        this.eventHandlers[event].push(listener);
    }

    protected emit(event: string, ...args: any[]) : void {
        if (typeof this.eventHandlers[event] === 'undefined') {
            return;
        }

        const listeners = this.eventHandlers[event].slice();
        for (const listener of listeners) {
            listener.apply(this, args as any);
        }
    }
}
