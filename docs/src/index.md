---
layout: page
pageClass: rt-home
sidebar: false
aside: false
title: Routup
description: A minimalistic, runtime-agnostic HTTP routing framework built on Web standard Request and Response.
hero:
    eyebrow:
        badge: 'v6'
        text: 'HTTP routing on Request & Response'
    title: 'Match the route.'
    highlight: 'Return the response.'
    description: 'A minimalistic HTTP framework built on Web-standard `Request` and `Response`. Handlers return values, middleware awaits `event.next()`, and the same app runs on Node.js, Bun, Deno and Cloudflare Workers.'
    actions:
        - text: 'Get Started'
          link: '/guide/'
        - text: 'View on GitHub'
          link: 'https://github.com/routup/routup'
    install: 'npm install routup'
    meta: 'MIT licensed · Node 22+ · ESM-only · TypeScript-first'
    code: &hero-code |
        import { App, defineCoreHandler, serve } from 'routup';

        const app = new App();

        app.get('/users/:id', defineCoreHandler(
            (event) => ({ id: Number(event.params.id) })
        ));

        serve(app, { port: 3000 });
    request:
        label: 'Request to the sample app (method and path)'
pipeline:
    title: 'Pipeline'
    steps:
        - name: 'Request'
          detail: 'app.fetch(req)'
        - name: 'router'
          detail: 'lookup()'
        - name: 'middleware'
          detail: 'event.next()'
        - name: 'handler'
          detail: 'return { id }'
        - name: 'Response'
          detail: '200 OK'
features:
    eyebrow: "// what's in the box"
    title: 'Six pieces. One small core.'
    lede: 'Everything else is a tree-shakeable helper or a plugin you opt into.'
    items:
        - title: 'Web Standards'
          text: '`app.fetch()` takes a Web `Request`; handlers return anything `toResponse()` converts.'
          code: 'await app.fetch(new Request(url))'
        - title: 'Runtime agnostic'
          text: 'Conditional exports pick the adapter for the runtime you are on.'
          code: |-
              import { serve } from 'routup'
              // Bun resolves routup/bun
        - title: 'Return-based handlers'
          text: 'Return a value; content type, ETag and 304 are handled.'
          code: '(event) => ({ id: 1 })'
        - title: 'Onion middleware'
          text: '`await event.next()` wraps every handler downstream.'
          code: |-
              const res = await event.next();
              return res;
        - title: 'Plugins'
          text: 'An object with `name` and `install(app)`; `version` and `singleton` are optional.'
          code: "app.use({ name: 'auth', install(app) {} })"
        - title: 'Tree-shakeable helpers'
          text: '`getRequestIP`, `sendRedirect`, … import only what you use.'
          code: "import { getRequestIP } from 'routup'"
routing:
    eyebrow: '// routing'
    title: 'Every request finds its route.'
    lede: 'Patterns from path-to-regexp. Params land on `event.params`.'
    map:
        title: 'Route table'
        result: 'lookup → 1 match'
    columns:
        pattern: 'Pattern'
        label: 'Kind'
        matches: 'Matches'
    syntax:
        - pattern: '/users/:id'
          label: 'Named parameter'
          matches: '/users/42'
        - pattern: '/files/{*path}'
          label: 'Wildcard'
          matches: '/files/a/b.png'
        - pattern: '/users{/:id}'
          label: 'Optional segment'
          matches: '/users, /users/7'
    routers:
        text: 'The router is pluggable: pass one with `new App({ router })`.'
        items:
            - name: 'LinearRouter'
              note: 'default'
            - name: 'TrieRouter'
            - name: 'SmartRouter'
    link:
        text: 'Paths guide'
        link: '/guide/paths'
runtimes:
    eyebrow: '// runtimes'
    title: 'One app.'
    highlight: 'Every runtime.'
    lede: 'Import from `routup`: Node.js, Bun, Deno and Cloudflare get their own entry, any other runtime the generic one. Service Workers import `routup/service-worker`.'
    core: 'app.fetch(request)'
    items:
        - name: 'Node.js'
          entry: 'routup/node'
        - name: 'Bun'
          entry: 'routup/bun'
        - name: 'Deno'
          entry: 'routup/deno'
        - name: 'Cloudflare'
          entry: 'routup/cloudflare'
        - name: 'Service Worker'
          entry: 'routup/service-worker'
        - name: 'Generic'
          entry: 'routup/generic'
quickstart:
    eyebrow: '// quickstart'
    title: 'From zero to first request'
    lede: 'Install the package, define a handler, serve the app.'
    active: 1
    tabs:
        - label: 'Install'
          code: 'npm install routup'
        - label: 'Define'
          code: *hero-code
        - label: 'Serve'
          code: |
              $ node app.ts
              $ curl localhost:3000/users/42
              {"id":42}
    link:
        text: 'Installation guide'
        link: '/guide/installation'
express:
    eyebrow: 'routup/node'
    title: 'Drop in alongside Express.'
    text: 'Wrap Node middleware with `fromNodeMiddleware()`, or turn the app into a `(req, res)` handler with `toNodeHandler()`.'
    file: 'server.ts'
    code: |
        import cors from 'cors';
        import express from 'express';
        import { App, fromNodeMiddleware, toNodeHandler } from 'routup/node';

        const app = new App();

        app.use(fromNodeMiddleware(cors()));       // reuse Express middleware

        express()
            .use('/v2', toNodeHandler(app))        // or mount routup inside Express
            .listen(3000);
    link:
        text: 'Express compatibility'
        link: '/guide/express-compatibility'
plugins:
    eyebrow: '// ecosystem'
    title: 'Batteries, one install away.'
    lede: 'Install from npm, register with `app.use()`.'
    link:
        text: 'All plugins'
        link: 'https://plugins.routup.dev/'
    items:
        - package: '@routup/basic'
          summary: 'Body, cookie and query in one.'
          link: 'https://plugins.routup.dev/basic/'
        - package: '@routup/body'
          summary: 'Parse JSON, form and raw bodies.'
          link: 'https://plugins.routup.dev/body/'
        - package: '@routup/cookie'
          summary: 'Read and set cookies.'
          link: 'https://plugins.routup.dev/cookie/'
        - package: '@routup/query'
          summary: 'Parse the query string.'
          link: 'https://plugins.routup.dev/query/'
        - package: '@routup/assets'
          summary: 'Serve static files.'
          link: 'https://plugins.routup.dev/assets/'
        - package: '@routup/decorators'
          summary: 'Class controllers with decorators.'
          link: 'https://plugins.routup.dev/decorators/'
        - package: '@routup/swagger-ui'
          summary: 'Serve Swagger UI.'
          link: 'https://plugins.routup.dev/swagger-ui/'
        - package: '@routup/cors'
          summary: 'Preflight and CORS headers.'
          link: 'https://plugins.routup.dev/cors/'
        - package: '@routup/logger'
          summary: 'Log requests.'
          link: 'https://plugins.routup.dev/logger/'
        - package: '@routup/rate-limit'
          summary: 'Limit requests per client.'
          link: 'https://plugins.routup.dev/rate-limit/'
        - package: '@routup/rate-limit-redis'
          summary: 'Redis store for rate-limit.'
          link: 'https://plugins.routup.dev/rate-limit-redis/'
        - package: '@routup/prometheus'
          summary: 'Expose Prometheus metrics.'
          link: 'https://plugins.routup.dev/prometheus/'
        - package: '@routup/i18n'
          summary: 'Per-request translations.'
          link: 'https://plugins.routup.dev/i18n/'
---

<script setup>
import RtHome from './.vitepress/components/home/RtHome.vue';
</script>

<RtHome />
