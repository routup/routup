# Reference: jshttp/content-disposition

Pins the upstream version we benchmark `setResponseHeaderAttachment` against. Update the SHA + version when re-syncing.

| Field | Value |
|---|---|
| Repo | https://github.com/jshttp/content-disposition |
| Pinned commit | `3d217fb8d86a4d914ffcb9955fedd114d5f7ed46` |
| Pinned version | `1.1.0` |
| Last synced | 2026-05-08 |

## Mapping

| Upstream (`src/index.ts`) | Local (`src/response/helpers/header-disposition.ts`) | Notes |
|---|---|---|
| `create(filename, options?)` | `setResponseHeaderAttachment(event, filename?)` / `setResponseHeaderInline(event, filename?)` | Both delegate to private `setDisposition(event, type, filename)`. Local always uses default `?` ASCII fallback (no `fallback` option). |
| `encodeExtended(str)` | `encodeExtended(value)` | Equivalent output. Uses `encodeURIComponent` + `ENCODE_URL_ATTR_CHAR_REGEXP`. |
| `getAscii(val)` | `getAscii(value)` | Equivalent. Replaces non-ASCII with `?`. |
| `qstring(str)` | `quoteString(value)` | Equivalent. Escapes `\` and `"` as `\\$&`. |
| `format({ type, parameters })` (the `filename` token-vs-quoted-vs-extended branching inside) | `formatFilename(value)` + branching in `setDisposition` | Local inlines the branch for the single `filename`/`filename*=` pair instead of generic param iteration. |
| `type` option (`inline`, `attachment`) | Two named helpers | `setResponseHeaderAttachment` / `setResponseHeaderInline`. Custom types not exposed. |
| `parse(header)` | — | Not implemented. Add if we need to read incoming Content-Disposition (e.g. `multipart/form-data` upload parsing). |
| `format()` (general) | — | Not implemented. Local only emits the `<type>; filename=...; filename*=...` shape. |
| `decodeExtended(str)` | — | Not implemented (parse-side only). |
| `multipart` mode | — | Not implemented. RFC 7578 escaping (`%0A`/`%0D`/`%22` inside quoted-string) is parser/builder-only; routup is HTTP-response-side. |
| `fallback` option (`false` / custom string) | — | Local always uses auto-generated `?` fallback. |

## Test parity

`test/unit/response/header-disposition.spec.ts` mirrors all 19 cases from upstream `src/create.spec.ts` for the no-options `create(filename)` flow, plus a small `inline` block that re-tests the same encoding rules through `setResponseHeaderInline`:

- POSIX paths, Windows paths (incl. drive letter, trailing slashes)
- Quote escaping in ASCII filenames
- ISO-8859-1 (`«plans».pdf`, `µ`, `£`, `€`) with `?` substitution + `filename*=`
- Unicode (Cyrillic `планы.pdf`)
- Hex-escape passthrough (`the%20plans.pdf` → both `filename=` and `filename*=` with `%2520`)
- Special-char re-encoding (`'`, `*`, `(`, `)`)

Cases not ported (because the corresponding feature isn't implemented):

- All `with "fallback" option` cases (no `fallback` option)
- `with "type" option` cases that test custom/uppercase types — only the `inline`-vs-`attachment` distinction is covered, and casing is fixed by the helper choice

## Behavioural notes

- `ENCODE_URL_ATTR_CHAR_REGEXP` uses an `eslint-disable-next-line no-control-regex` comment — the `\x00-\x20` range is intentional (RFC 5987 attr-char does not allow CTLs).
- `setResponseContentTypeByFileName` is a routup-side side effect: setting the disposition also seeds `Content-Type` from the filename extension. Upstream has no such coupling.

## When to re-sync

- Touching `header-disposition.ts` or anything in `send-file.ts` that wires it.
- After upstream releases that change encoding rules (watch the changelog for changes to `encodeExtended` / `getAscii` / `qstring`).
- If we ever expose custom `type` strings or a `fallback` option, port the relevant cases at the same time.
