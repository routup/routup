# Server-Sent Events

A route that streams three events with `createEventStream` and closes the stream.

<<< @/../examples/server-sent-events/app.ts

## Try it

Install `routup`, serve the app from a second file and start it with your [runtime](/guide/runtime-environments):

```typescript
import { serve } from 'routup';
import { app } from './app.ts';

serve(app, { port: 3000 });
```

```bash
curl -N http://localhost:3000/events
# id: 1
# event: tick
# data: one
#
# id: 2
# event: tick
# data: two
#
# id: 3
# event: tick
# data: three
#
```

## How it works

- `createEventStream(event)` returns a handle whose `response` the handler returns. The response has `content-type: text/event-stream`, `cache-control` that forbids caching, `x-accel-buffering: no` and `connection: keep-alive`, plus the status and headers set on `event.response`.
- `write()` serializes a message as `id:`, `event:`, `retry:` and one `data:` line per line of `data`, followed by a blank line. A string argument is sent as `data` alone.
- Messages written before the handler returns wait in the stream until the client reads them. `end()` closes the stream; after that, `write()` returns `false`.
- See [createEventStream](/guide/response#createeventstream) for writing over time and keep-alive comments.
