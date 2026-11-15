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
    code: |
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
---

<script setup>
import RtHome from './.vitepress/components/home/RtHome.vue';
</script>

<RtHome />
