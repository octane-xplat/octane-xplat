### Serve routes as HTML or static pages

The optional `@octane-xplat/web-host` package renders Web routes before they reach
the browser. Browser startup adopts that HTML without repeating initial loaders.
You can author the whole document as a component or use an HTML template. The
Fetch handler works with srvx; rendering stays separate from cross-platform route data.

```ts
import { createWebHandler } from '@octane-xplat/web-host/server'
import { catalog } from './routes.web.tsrx'

export const handle = createWebHandler({
  catalog,
  buildId: 'store-v1',
  assets: { scripts: ['/client.js'] },
  transfer: match => ({ data: match.data as { name: string }, context: {} }),
})
```

With `webHost()` installed in Vite, shared modules can expose named server-only
re-exports. Client builds remove them and reject remaining `.server` imports.

```ts
export { requestContext } from './context.server'
```

For public pages, export a `createWebRenderer` from your compiled server entry and
pass it to `prerender`. Content keys and renderer revisions control reuse; each
build still assembles current document assets and browser startup data.

```js
import { prerender } from '@octane-xplat/web-host/prerender'
import { renderer } from './dist/server/static.web.js'

await prerender(renderer, {
  origin: 'https://shop.example.com',
  outDir: 'dist/static',
  cacheFile: '.cache/pages.json',
  revision: 'renderer-v1',
  paths: [{ destination: { to: '/products/:id', params: { id: 'coat' } }, key: 'coat-v3' }],
})
```

[Web rendering and static page guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/web-rendering.md)
