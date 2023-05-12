# API Reference

## Options

### `windowMs`

> `number`

Time frame for which requests are checked/remembered. Also used in the
`Retry-After` header when the limit is reached.

Defaults to `60000` ms (= 1 minute).

### `max`

> `number | function`

The maximum number of connections to allow during the `window` before rate
limiting the client.

Can be the limit itself as a number or a (sync/async) function that accepts the
node http `request` and `response` objects and then returns a number.

Defaults to `5`. Set it to `0` to disable the rate limiter.

An example of using a function:

```ts
const isPremium = async (user) => {
	// ...
}

const handler = createHandler({
	// ...
	max: async (request, response) => {
		if (await isPremium(request.user)) return 10
		else return 5
	},
})
```

### `message`

> `any`

The response body to send back when a client is rate limited.

May be a `string`, JSON object, or any other value.
It can also be a (sync/async) function that accepts the
node http request and response objects and then returns a `string`, JSON object or any
other value.

Defaults to `'Too many requests, please try again later.'`

An example of using a function:

```ts
const isPremium = async (user) => {
	// ...
}

const handler = createHandler({
	// ...
	message: async (request, response) => {
		if (await isPremium(request.user)) {
            return 'You can only make 10 requests every hour.'
        }
			
        return 'You can only make 5 requests every hour.'
	},
})
```

### `statusCode`

> `number`

The HTTP status code to send back when a client is rate limited.

Defaults to `429` (HTTP 429 Too Many Requests - RFC 6585).

### `skipFailedRequest`

> `boolean`

When set to `true`, failed requests won't be counted. Request considered failed
when the `requestWasSuccessful` option returns `false`. By default, this means
requests fail when:

- the response status >= 400
- the request was cancelled before last chunk of data was sent (response `close`
  event triggered)
- the response `error` event was triggered by response

Defaults to `false`.

### `skipSuccessfulRequest`

> `boolean`

If `true`, the library will (by default) skip all requests that are considered
'failed' by the `requestWasSuccessful` function. By default, this means requests
succeed when the response status code < 400.

Defaults to `false`.

### `keyGenerator`

> `function`

Method to generate custom identifiers for clients.

Should be a (sync/async) function that accepts the node http `request` and
`response` objects and then returns a string.

By default, the client's IP address is used:

```ts
import { getRequestIP } from 'routup';

const handler = createHandler({
    // ...
    keyGenerator: (request, response) => getRequestIP(request, { trustProxy: true }),
})
```

### `handler`

> `function`

Routup handler that sends back a response when a client is
rate-limited.

By default, sends back the `statusCode` and `message` set via the `options`,
similar to this:

```ts
import { send } from 'routup';

const handler = createHandler({
	// ...
	handler(req, res, next, options) {
        res.statusCode = options.statusCode;
        
        send(res, options.message);
    }
})
```

### `skip`

> `function`

Function to determine whether this request counts towards a client's
quota. Should be a (sync/async) function that accepts the node http `request` and
`response` objects and then returns `true` or `false`.

Could also act as an allow list for certain keys:

```ts
const allowlist = ['192.168.0.56', '192.168.0.21']

const handler = createHandler({
	// ...
	skip: (request, response) => allowlist.includes(request.ip),
})
```

By default, it skips no requests:

```ts
const handler = createHandler({
	// ...
	skip: (request, response) => false,
})
```

### `requestWasSuccessful`

> `function`

Method to determine whether the request counts as 'successful'. Used when
either `skipSuccessfulRequest` or `skipFailedRequest` is set to true. Should
be a (sync/async) function that accepts the node http `request` and `response`
objects and then returns `true` or `false`.

By default, requests with a response status code less than 400 are considered
successful:

```ts
const handler = createHandler({
	// ...
	requestWasSuccessful: (req, res) => res.statusCode < 400,
})
```

### `store`

The `Store` to use to store the hit count for each client.
