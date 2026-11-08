# Reference: jshttp/content-disposition

Routup depends on this package (see `package.json`) and delegates header creation and parsing to it. Encoding rules live upstream; do not reimplement them locally.

| Field | Value |
|---|---|
| Repo | https://github.com/jshttp/content-disposition |

## Mapping

| Upstream | Local (`src/response/helpers/header-disposition.ts`) | Notes |
|---|---|---|
| `create(filename, options?)` | `createContentDisposition(filename?, options?)` | Direct pass-through. Accepts `type` and `fallback`. |
| `parse(header, options?)` | `parseContentDisposition(header, options?)` | Returns `null` for a `null`/`undefined` header. A malformed header throws `AppError` with status 400 and the upstream error as `cause`. |
| `create(filename, { type })` | `setResponseHeaderAttachment(event, filename?)` / `setResponseHeaderInline(event, filename?)` | Set the response header through the private `setContentDisposition`. |

## Behavioural notes

- `setResponseContentTypeByFileName` is a routup-side side effect: setting the disposition with a filename also seeds `Content-Type` from the filename extension. Upstream has no such coupling.

## Tests

`test/unit/response/header-disposition.spec.ts` covers the local helpers.
