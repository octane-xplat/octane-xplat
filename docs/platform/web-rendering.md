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

## Keep server code out of clients

Put request services and private dependencies in a `.server.ts` file (or a
`.server/` directory). A shared module can expose them through explicit named
re-exports. `webHost()` removes those exports from browser builds; the server
build keeps them. The maintained store example uses this pattern for context.

```ts
// context.server.ts
export function requestContext(request: Request) {
  return { sessionCookie: request.headers.get('Cookie') }
}

// routes.web.tsrx — alongside the catalog export
export { requestContext } from './context.server'

// server.web.ts
import { catalog, requestContext } from './routes.web.tsrx'
// Pass context: requestContext to createWebHandler.
```

Direct imports, dynamic imports and `export *` from server modules fail in client
builds, including resolved aliases and transitive imports. Use named re-exports
only for values consumed by the server entry. They do not create local bindings
or remote functions. Ordinary route `loader` callbacks remain cross-platform;
use an HTTP API inside a client loader when it needs server data.

```ts
// This belongs in a .server.ts module, never in a shared screen:
import { database } from './database.server'
export const findProduct = (id: string) => database.products.find(id)

// A shared module may expose it to server consumers:
export { findProduct } from './products.server'
```

The same boundary is included in `xplatBoundary` and the native presets. Custom
client builds can add `serverBoundary()`. Build source maps omit authored source
text, and transformed development maps do not retain removed re-exports. Keep
secrets in server modules rather than comments or unrelated shared declarations.

```ts
import { serverBoundary } from '@octane-xplat/web-host/vite'
export default { plugins: [serverBoundary()] }
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

Baked route data alone does not produce HTML files; use the prerendering workflow
below for that. These checks qualify buffered rendering, hydration in a DOM
harness, and local HTTP through srvx. Streaming and hosting-provider deployments
need separate qualification:

```sh
pnpm exec turbo run test typecheck --filter=@octane-xplat/web-host
```


## Generate static pages

Build the maintained example to produce ready-to-serve product pages in
`packages/web-host/example/dist/static`. Run the same build again: its result
reports `reused: 2` when the server bundle and content keys are unchanged.
Use `STATIC=1` to serve those files before falling back to request-time rendering.

```sh
pnpm exec turbo run build:example --filter=@octane-xplat/web-host --force
STATIC=1 node packages/web-host/example/serve.mjs
# Open http://localhost:4174/products/coat
```

Export a `createWebRenderer` from your server entry for public pages. It uses the
same catalog, public projection and document options as `createWebHandler`.
Static output requires a successful HTML page explicitly marked `public`;
redirects, failures, private responses and cookies stop the build.

```ts
// static.web.ts — compile this as a server entry with webHost() and octane().
import { createWebRenderer } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web.tsrx'

export const renderer = createWebRenderer({
  catalog,
  buildId: 'store-v1',
  assets: { scripts: ['/assets/client.abc123.js'] },
  transfer: match => ({ data: match.data as { name: string }, context: {} }),
  response: () => ({ headers: { 'Cache-Control': 'public, max-age=60' } }),
})
```

In a Node build script, import that compiled server entry and enumerate concrete
route destinations. Each `key` identifies the content used by that page; use
`null` when the page must render on every build. Enumeration can fetch records
from your content service before returning its list. Required parameters are
checked against the renderer's catalog when this script is typed.

```js
// prerender.mjs — run after compiling the server and browser entries.
import { prerender } from '@octane-xplat/web-host/prerender'
import { renderer } from './dist/server/static.web.js'

const result = await prerender(renderer, {
  origin: 'https://shop.example.com',
  outDir: 'dist/static',
  cacheFile: '.cache/static-pages.json',
  revision: 'product-renderer-v1',
  paths: async () => [
    { destination: { to: '/products/:id', params: { id: 'coat' } }, key: 'coat-v3' },
    { destination: { to: '/products/:id', params: { id: 'hat' } }, key: 'hat-v2' },
  ],
})
console.log(result) // { rendered: 2, reused: 0, paths: [...] } on the first build
```

Reuse skips preparation, guards, loaders and app rendering. Include every data
dependency in the content key, and change `revision` whenever route code, guards,
loaders, public projection, app markup or rendering dependencies change. A hash
of the complete server bundle is a conservative revision, as the maintained
example demonstrates. For multiple chunks, hash every server chunk. Keep the
cache private to the build even though it contains only projected public data.

```js
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

// For a single-file server bundle; pass this value as revision.
const revision = createHash('sha256')
  .update(await readFile('dist/server/static.web.js'))
  .digest('hex')
```

Every build assembles the document again using current asset URLs and `buildId`,
even for reused content. Cached app markup, CSS and route metadata stay unchanged;
if they contain build-specific image URLs or other assets, include those changes
in `revision` too. The document's build ID must match browser startup as usual.

```ts
const buildId = 'store-v2' // use in both server rendering and startWebApp
const assets = { scripts: ['/assets/client.new.js'], styles: ['/assets/app.new.css'] }
// Pass these to createWebRenderer for the next build.
```

`outDir` belongs exclusively to prerendering. A successful build replaces its old
pages, removing paths no longer enumerated; a rendering failure leaves the old
output intact. Keep browser assets and the cache outside it. Existing directories
without the ownership marker are refused. Paths cannot contain query strings,
fragments, traversal segments or conflicting filenames.

```text
dist/
  client/                     browser assets (separate build)
  static/
    .xplat-prerender           ownership marker; retain between local builds
    products/coat/index.html
    products/hat/index.html
.cache/static-pages.json      reusable public content
```

Deploy the static directory alongside your browser assets, with directory-index
serving enabled. File output does not carry HTTP headers: configure caching and
security headers on the static host. Extra response headers are rejected to
avoid silently dropping behavior. srvx can serve the files locally; deployment
to a particular hosting provider remains a separate integration.

```js
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'

serve({
  middleware: [
    staticMiddleware({ dir: 'dist/client' }),
    staticMiddleware({ dir: 'dist/static' }),
  ],
  fetch: () => new Response('Not Found', { status: 404 }),
})
```
