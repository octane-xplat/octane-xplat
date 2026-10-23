# Render a Web page on the server

> Send a ready-to-read page, then make it interactive in the browser.

The optional `@octane-xplat/web-host` package can render your existing route
catalog into HTML. The browser adopts that page without repeating its first
guard or loader. Later navigation uses the normal Xplat router.

```ts
// client.web.ts
import { startWebApp } from '@octane-xplat/web-host/client'
import { catalog } from './routes.web.tsrx'

const app = await startWebApp({ catalog, buildId: 'store-v1' })
await app.router.push({ to: '/products/:id', params: { id: 'hat' } })
// When the app owner ends this document's lifetime:
app.dispose()
```

This is a Web-only host. It requires Octane 0.14 or newer and separate server
and browser compilation. The ordinary generated startup remains client-rendered;
iOS, Android and desktop apps continue using their existing hosts.

## Try the maintained example

From a framework checkout, build the small store example and start its local
HTTP server. Open the printed address: the product name is already in the HTML,
and the “Add to bag” button works after browser startup.

```sh
pnpm exec turbo run build:example --filter=@octane-xplat/web-host
node packages/web-host/example/serve.mjs
# Open http://localhost:4174/products/coat
```

The [example's build script](../../packages/web-host/example/build.mjs) compiles
both entry points with Octane's Vite plugin. Its fixed `client.js` filename is
for a local example. For deployment, supply the current build's asset URLs,
change `buildId` with every deployment, and retain assets used by open tabs.

```ts
// Use the same buildId in server.web.ts and client.web.ts.
const buildId = 'release-2026-10-23'
const assets = {
  scripts: ['/assets/client.abc123.js'],
  styles: ['/assets/app.def456.css'],
}
```

Use `webHost()` alongside `octane()` in both Vite builds. It selects Web source
files, compiles Xplat dependencies for the server, and binds browser-only root
creation to an explicit unsupported server implementation.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { octane } from 'octane/compiler/vite'
import { webHost } from '@octane-xplat/web-host/vite'

export default defineConfig({ plugins: [webHost(), octane()] })
```

## Create the request handler

A Fetch handler accepts a `Request` and returns a `Response`. Give it the
executable catalog returned by `defineRoutes`, or a generated platform catalog;
a discovery JSON manifest does not contain screen functions. The default app
renders a route outlet, so a separate `App` component is optional.

```ts
// server.web.ts — compiled for the server
import { createWebHandler } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web.tsrx'

export const handle = createWebHandler({
  catalog,
  buildId: 'store-v1',
  assets: { scripts: ['/client.js'] },
  transfer: (match) => ({
    data: match.data as { name: string },
    context: {},
  }),
})

const response = await handle(new Request('https://store.example/products/coat'))
console.log(response.status) // 200
```

Use [srvx](https://srvx.h3.dev/guide) for the HTTP server. It owns the listener
and Request/Response conversion; its static middleware serves browser assets
before page requests reach `handle`. Install it in your server app, then connect
the compiled handler as in the [maintained server](../../packages/web-host/example/serve.mjs).

```sh
pnpm add srvx
```

```js
// serve.mjs — the build writes server and browser outputs separately.
import { fileURLToPath } from 'node:url'
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'
import { handle } from './dist/server/server.web.js'

serve({
  middleware: [staticMiddleware({
    dir: fileURLToPath(new URL('./dist/client', import.meta.url)),
  })],
  fetch: handle,
})
```

The Fetch handler is independent of the listener. A hosting platform that
accepts Fetch handlers can call it directly. Asset delivery and deployment still
follow that platform's setup; `srvx/static` requires a runtime with Node filesystem
APIs. The maintained example and HTTP tests run on Node.

```ts
// A Fetch-native host can use this entry without opening a local listener.
export default { fetch: handle }
```

## Choose what reaches the screen and browser

`context(request)` supplies private dependencies to preparation. `transfer`
explicitly selects public data for both the server screen and its first browser
render. Screens and layouts must use that public shape: private services are
available to guards and loaders, not to rendering. Include public parent-loader
and guard context if a screen needs it. Nothing is serialized automatically.

```ts
// Options added to createWebHandler. Keep server dependencies in this entry.
const requestOptions = {
  context: (request: Request) => ({
    language: request.headers.get('Accept-Language') ?? 'en',
  }),
  transfer: (match: { data: unknown; context: Record<string, unknown> }) => ({
    data: match.data as { name: string },
    context: { language: String(match.context.language) },
  }),
}
```

Transferred values must be plain JSON: strings, finite numbers, booleans, null,
dense arrays and plain objects. Dates, functions, accessors, undefined and cycles
fail the request. Use `null` when a route has no data. Startup rejects a document
from a different URL or build before changing its DOM or browser history.

```ts
const transfer = () => ({ data: null, context: {} })
// Convert a date intentionally before returning it:
const publicDate = { publishedAt: new Date('2026-10-23').toISOString() }
```

Client context supplies fresh dependencies for later navigation. This host does
not create remote-loader endpoints or remove server imports from shared route
modules. Keep database clients and secrets in the server entry; shared live
loaders need a browser-compatible implementation or an injected service. See
[route context](../app/navigation.md) for typed dependency declarations.

```ts
// Browser entry: later loaders receive this context.
await startWebApp({
  catalog,
  buildId: 'store-v1',
  context: () => ({ language: navigator.language }),
  onRecoverableError: (error) => console.error('Page hydration failed', error),
})
```

## Author the whole document

A `Document` component replaces the default HTML shell. It runs for each server
request and owns `<html>`, `<head>` and `<body>`. Place each provided slot once:
`head` inside the head, and `children` plus `scripts` inside the body. Only the
app in `children` hydrates; put interactive headers or other persistent controls
in `App`, not in `Document`.

```tsx
/** @jsxImportSource octane */
import type { WebDocumentProps } from '@octane-xplat/web-host/server'

export function Document(props: WebDocumentProps) {
  return <html lang="en">
    <head><meta charSet="utf-8" />{props.head}</head>
    <body><header>My store</header>{props.children}{props.scripts}</body>
  </html>
}
// Pass Document in createWebHandler({ catalog, buildId, assets, transfer, Document }).
```

An existing `index.html` can instead use three explicit slots. Pass its contents
as `template`; do not also pass `Document`. The host fills the app container,
metadata, styles and startup scripts. The file is not automatically read or
transformed by Vite, so asset URLs must already belong to the current build.

```html
<!doctype html>
<html lang="en">
  <head><!--xplat:head--></head>
  <body><!--xplat:app--><!--xplat:scripts--></body>
</html>
```

For an interactive app shell, supply the same `App` to server and browser
startup. Use the router passed to it with typed hooks; never configure a shared
default router for a server request. Named stacks also need matching `stacks`
options and an outlet for each visible stack.

```tsx
/** @jsxImportSource octane */
import { RouteOutlet } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import type { WebAppProps } from '@octane-xplat/web-host/client'

export function App(props: WebAppProps) {
  const navigation = useRouter(props.router)
  return <main>
    <button onClick={() => navigation.back()}>Back</button>
    <RouteOutlet />
  </main>
}
```

## Mix server and client rendering

Select `mode` by request to serve product pages as HTML and start a workspace
entirely in the browser. Client mode skips server preparation; its first browser
navigation runs guards and loaders. This choice is separate from `live` versus
`baked`, which controls where route data comes from on every platform.

```ts
const mode = (request: Request): 'server' | 'client' =>
  new URL(request.url).pathname.startsWith('/workspace') ? 'client' : 'server'
// Pass mode to createWebHandler. Both kinds share the same route catalog.
```

Missing routes return 404, forbidden routes 403, invalid input 400, and unexpected
errors a generic 500. Routing redirects produce 302 responses; a thrown Fetch
`Response` keeps its status and headers. GET and HEAD are supported. Use
`response` to set successful-page headers; personalized HTML defaults to
`Cache-Control: private, no-store`.

```ts
const response = () => ({ headers: { 'Cache-Control': 'public, max-age=60' } })
// Only use public caching for pages whose content is the same for every visitor.
// Pass response to createWebHandler; report unexpected errors through onError.
```

Static path enumeration and incremental HTML generation are separate work. Baked
route data alone does not produce HTML files. These checks qualify buffered
rendering, hydration in a DOM harness, and local HTTP through srvx. Streaming
and hosting-provider deployments need separate qualification:

```sh
pnpm exec turbo run test typecheck --filter=@octane-xplat/web-host
```
