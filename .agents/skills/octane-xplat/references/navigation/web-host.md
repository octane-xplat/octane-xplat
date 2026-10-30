# Web document hosting

Use only when adding request-time HTML, lazy route code, server modules, or static output. Ordinary route setup remains in [route authoring](authoring.md); shared lifecycle follows [navigation ownership](ownership.md).

## Optional Web document host

Use `@octane-xplat/web-host` for request-time HTML over an executable catalog.
Read the [Web rendering guide](../../../../../docs/platform/web-rendering.md) for
paired server/browser builds and the maintained example. Keep request context
local, require an explicit public projection, and keep server dependencies in
the server entry. The public projection is also the server screen's props;
screens cannot rely on private preparation services. Use the passed router with
typed hooks, never the shared default client in a request.

```ts
import { createWebHandler } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web.tsrx'
export const handle = createWebHandler({
  catalog, buildId: 'store-v1', assets: { scripts: ['/client.js'] },
  transfer: match => ({ data: match.data as { name: string }, context: {} }),
})
```

A component `Document` is a server-only shell; only its app container hydrates.
Place interactive persistent UI in the same `App` supplied on both sides.
`mode: 'client'` skips server preparation, whereas `live`/`baked` still describes
portable data provenance. This package provides neither remote loaders nor
server-import stripping, streaming, or static-path enumeration.

```ts
import { startWebApp } from '@octane-xplat/web-host/client'
await startWebApp({ catalog, buildId: 'store-v1' })
```

Use `srvx` for the listening server instead of implementing Node HTTP conversion.
Serve built browser assets with `srvx/static` on Node-compatible runtimes. A
Fetch-native deployment can call the same handler directly; provider deployment
and asset storage still need their own qualification.

```ts
import { serve } from 'srvx'
serve({ fetch: handle })
```

### Lazy route code

Generated file routes defer module loading until preparation or `router.preload`.
Use preloading for code only; it runs module top-level code but no search validator,
context factory, guard, loader or head callback. Do not cache authorization or move
request work into module scope. Layouts, Markdown and explicit programmatic imports
stay eager; host bundlers decide whether dynamic imports produce separate chunks.
Web hydration warms the initial module before adopting transferred data, without
repeating preparation. Import failures return `failed` with phase `module`.

```ts
import { router } from '@octane-xplat/ui/routing'
const destination = { to: '/items/:id', params: { id: 'coat' } } as const
await router.preload(destination)
await router.push(destination) // guards and loaders still run
```

See [warm a screen](../../../../../docs/app/navigation.md#warm-a-screen-before-opening-it)
for cancellation and bundling limits. `manifestToJson` does not import modules:
`moduleLoaded: false` means callback flags are unknown, not absent; static generated
JSON remains the complete build-time discovery source.

```ts
import { manifestToJson } from '@octane-xplat/ui/routing/core'
import { routes } from './routes.gen.catalog.web'
const metadata = manifestToJson(routes)
const deferred = metadata.routes.filter(route => route.moduleLoaded === false)
```

### Server-only modules

Use `.server.ts` or `.server/` for private web-host services. Shared modules can
expose explicit named re-exports; webHost/xplatBoundary erase those exports in
client graphs and reject residual imports, dynamic imports or export-star paths.
No local callback stripping or automatic RPC is implied: ordinary loaders stay
cross-platform. Custom bundlers must install the boundary plugin. See
[server code](../../../../../docs/platform/web-rendering.md#keep-server-code-out-of-clients).

```ts
// Shared catalog: server-only entry points may consume this export.
export { requestContext } from './context.server'
```


### Static HTML and incremental builds

Use the Web-only `createWebRenderer` in a compiled server entry, then call Node's
`@octane-xplat/web-host/prerender` with typed destinations, a renderer revision,
and per-page content keys. Only explicit public 200 HTML responses qualify.
Cache hits skip guards/loaders/rendering: include all data inputs in keys and all
rendering/preparation code changes in revision. `null` keys disable reuse.
Documents, assets and build IDs refresh on every build; URLs embedded inside
cached app markup require invalidation. Keep outDir dedicated and cacheFile outside
it. Do not use this cache for personalized pages or confuse static HTML with baked
cross-platform data. See [static pages](../../../../../docs/platform/web-rendering.md#generate-static-pages).

```ts
import { prerender } from '@octane-xplat/web-host/prerender'
import { renderer } from './dist/server/static.web.js'
await prerender(renderer, {
  origin: 'https://example.com', outDir: 'dist/static', cacheFile: '.cache/pages.json',
  revision: 'renderer-v2',
  paths: [{ destination: { to: '/products/:id', params: { id: 'coat' } }, key: 'coat-v3' }],
})
```
