# @octane-xplat/web-host

> Optional Fetch, HTML rendering and hydration host for Octane Xplat routes

Optional Web rendering over Xplat's existing route catalog. See
[the Web rendering guide](https://octane-xplat.goddardai.org/web-rendering) for the Fetch
handler, explicit public data transfer, component-authored documents, HTML
templates, browser startup, incremental static output and rendered not-found
pages.

In an existing Xplat app, install the package, then follow the guide to add
server rendering:

```sh
bun add @octane-xplat/web-host
```

To try the [maintained example](https://github.com/octane-xplat/octane-xplat/blob/main/packages/web-host/example/build.mjs),
run these commands from a framework checkout. It builds separate server and
browser entries, then starts a local server:

```sh
bun run turbo run build:example --filter=@octane-xplat/web-host
node packages/web-host/example/serve.mjs
```

For a minimal route, save this as `src/routes.web.tsx`:

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'

function Welcome() {
  return <h1>Hello from the server</h1>
}

export const catalog = defineRoutes([
  defineRoute({ path: '/' }).screen(Welcome),
])
```

In `src/server.web.ts`, create a Fetch handler for that catalog. The script URL
must point to your compiled browser entry; follow the guide for the paired
browser startup and build configuration.

```ts
import { createWebHandler } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web'

export const handle = createWebHandler({
  catalog,
  buildId: 'welcome-v1',
  assets: { scripts: ['/client.js'] },
  transfer: () => ({ data: null, context: {} }),
})

const response = await handle(new Request('https://example.com/'))
console.log(response.status) // 200
```

[Generated API reference](https://octane-xplat.goddardai.org/api-web-host).
