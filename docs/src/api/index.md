# API Reference

The reference documents the functions, classes and constants of `routup` and their main types, with signatures. The [Guide](/guide/) explains how the pieces fit together.

| Page | What it covers |
|---|---|
| [App](/api/app) | `App`, its options, method shortcuts, plugin queries, `serve()` and `toNodeHandler()` |
| [Handlers](/api/handlers) | `defineCoreHandler()`, `defineErrorHandler()`, handler options and the Node.js and Fetch adapters |
| [Event](/api/event) | `IAppEvent`, the request, the response accumulator and `event.next()` |
| [Errors](/api/errors) | `AppError`, `createError()` and `isError()` |
| [Routers](/api/routers) | `IRouter`, `LinearRouter`, `TrieRouter`, `SmartRouter` and the lookup cache |
| [Request Helpers](/api/request-helpers) | Headers, content negotiation, client address, host and protocol |
| [Response Helpers](/api/response-helpers) | Redirects, files, streams, headers, caching and server-sent events |
| [Building Blocks](/api/advanced) | Type guards, plugin errors, the `Handler` and `AppEvent` classes, path matching, response conversion and constants |
