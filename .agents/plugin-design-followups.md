# Plugin Design Follow-ups

This document captures three structural issues with the current plugin model that surfaced while resolving issue #874 (wrapper-plugin dependency visibility) but were intentionally left unaddressed in that PR. Resolving #874 was descoped to dropping `Plugin.dependencies` rather than redesigning the install pipeline; these issues remain.

Pick them up individually — they are independent of each other and of any future dependency-validation feature.

## 1. Hooks register on the plugin's child router, not on the parent

**Symptom.** When a plugin's `install(router)` calls `router.on('request', fn)`, the listener is attached to the child router's `hookManager`. The child only fires its own hooks during `child.dispatch()` — i.e. only when the parent's pipeline has already matched the child and started dispatching into it. A plugin author who wants a global `request` hook (timing, request-id, structured logging) on the host gets per-plugin-router scope instead.

**Where.** `src/router/module.ts` — every plugin install builds `new Router({ name: plugin.name })`, runs `plugin.install(child)` on it, and pushes it into the parent stack. The hook manager is per-router and never bridges.

**Acceptance criteria for a fix.**
- A plugin installed via `parent.use(plugin)` (no path) can register a hook that fires on every request flowing through `parent`, not only on requests that reach the plugin's child.
- A plugin installed via `parent.use('/path', plugin)` continues to register hooks scoped to `/path`.
- Existing plugins that relied on `router.use(handler)` for middleware still work (their handlers should still run when the child router is dispatched).

**Possible directions.**
- Distinguish global vs scoped install: when no path is given, run `plugin.install(parent)` directly so handlers, middleware, and hooks all land at the parent's level. When a path is given, keep the child-router pattern.
- Or: forward the child's hook manager to the parent's via a bridge that fires both, with a path filter for scoped installs.

**Care.** Any change here is a breaking change for plugins that depended on the implicit per-plugin isolation. Document the migration in the plugin authoring guide.

## 2. Middleware in plugins is dispatch-isolated and cannot wrap parent siblings

**Symptom.** A plugin's middleware that calls `event.next()` only continues through its own child router's stack — not through subsequent items in the parent's stack. So a plugin that meant to wrap "everything" (e.g. a request logger that times the whole response) only wraps the empty tail of its own child router and returns to the parent immediately. The parent then runs the rest of its stack with no wrapping.

**Where.** `src/router/module.ts` — `executePipelineStepChildDispatch` calls `event.setNext` to a continuation that re-enters `this.executePipelineStep`, where `this` is the dispatching router. Inside the child's dispatch, `event.next()` resolves against the child's stack. There is no path back up to continue the parent's stack from inside the child.

**Acceptance criteria for a fix.**
- A globally-installed middleware plugin can call `event.next()` and have it run the rest of the parent's stack (true onion wrapping).
- Scoped middleware plugins continue to wrap only within their path scope.
- Returning the result of `event.next()` propagates the downstream response, including the `dispatched`/`response` mutations made by sibling handlers.

**Possible directions.**
- Tied to (1): if global plugins register on the parent directly, their middleware sits in `parent.stack` and `event.next()` already wraps siblings.
- Alternative: have the child router's `event.next()` chain up to the parent's pipeline when it falls off the end of its own stack — but this conflates path-scoped plugins with global ones.

## 3. `parent.use(router)` mutates the user-held child

**Symptom.** Calling `parent.use(child)` or `parent.use('/path', child)` mutates the `child` instance: it sets `child.pathMatcher` (via `setPath(path)`) and historically also set `child.parent` (the parent field has since been removed alongside dep validation, but path mutation remains). Mounting the same `child` into two different parents either overwrites the path or ends up with both mounts sharing the second parent's path, which is silently wrong.

**Where.** `src/router/module.ts` — the `use()` branch for `isRouterInstance(item)` calls `item.setPath(path)` on the user-supplied router and pushes it directly into `this.stack`.

**Acceptance criteria for a fix.**
- Mounting the same router on multiple parents at different paths produces the expected per-mount routing for each parent (each mount serves at its own path).
- Mounting on a single parent retains current behavior.
- The user-held router instance is not externally mutated by `use()`, or — if mutation is unavoidable — multi-mount is explicitly detected and either supported or rejected with a clear error.

**Possible directions.**
- **Clone-on-mount.** `use()` produces a per-mount copy that shares stack/plugins/hookManager by reference (so live edits on the original flow through) but has its own mount-specific state (path, eventually parent). Adds a `Router.clone({ path })` method.
- **Wrap-on-mount.** Push a lightweight `MountedRouter { inner, path }` wrapper into the parent's stack instead of the bare router. Dispatch delegates to `inner` after consulting the wrapper's path matcher. No mutation of `inner`.
- **Single-mount detection.** Throw on the second `use()` of a router that already has a path set, forcing users to construct fresh routers per mount. Smallest change, no new abstractions.

**Care.** This is closely tied to (1) — a clone-on-mount design also gives global-vs-scoped install a clean per-mount identity to attach state to.

## How these relate

(1) and (2) are the same defect with two faces — both stem from "every plugin gets its own dispatch sub-tree." The cleanest single fix is to distinguish global install (no path → `plugin.install(parent)`) from scoped install (`plugin.install(child)` mounted at the path). That fix dissolves both.

(3) is independent of (1)/(2) but shares the same architectural seam: the moment `parent.use(item)` decides what gets pushed into `parent.stack`. A redesign that addresses (3) by moving away from in-place mutation likely produces the right shape for global-vs-scoped plugin install too.

If the project decides to reintroduce a dependency feature later, prefer addressing (1) first — global plugins registering directly on the parent makes wrapper-bundled deps trivially visible to siblings (no propagation, no descent, no clones), which was the structural difficulty that motivated the original removal.
