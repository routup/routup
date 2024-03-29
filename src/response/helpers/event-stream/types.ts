/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
 */
export type EventStreamMessage = {
    /**
     * The event ID to set the EventSource object's last event ID value.
     */
    id?: string,
    /**
     * The reconnection time.
     * If the connection to the server is lost, the browser will wait for the specified time before attempting to reconnect.
     * This must be an integer, specifying the reconnection time in milliseconds.
     */
    retry?: number,
    /**
     * The data field for the message.
     */
    data?: string,
    /**
     * A string identifying the type of event described.
     */
    event?: string,
};
