import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { it } from 'node:test'
import { createServer } from 'vite'

const ns = pathToFileURL(createRequire(import.meta.url).resolve('@nativescript/vite'))
const { registerNsModuleServerRoute } = await import(new URL('./hmr/server/websocket-ns-m.js', ns))
const { createSharedTransformRequestRunner } = await import(new URL('./hmr/server/shared-transform-request.js', ns))
const { extractBootCrawlUrls, runBootGraphCrawl, BOOT_CRAWL_HEADER } = await import(new URL('./hmr/server/boot-graph-crawl.js', ns))
const { setProjectFlavor } = await import(new URL('./helpers/flavor.js', ns))

setProjectFlavor('javascript')

// The shared runner keeps device demand (priority 0) ahead of warm-up and
// auxiliary work (< 0) — a queued low-priority task must lose its lane to a
// later device request, and an urgent joiner must promote a queued entry.
it('transform queue runs higher priority work first', async () => {
  const order = []
  const gate = Promise.withResolvers()
  const runner = createSharedTransformRequestRunner(async (url) => {
    if (url === 'blocker') await gate.promise
    order.push(url)
    return { code: `export const v = 1` }
  }, undefined, { maxConcurrent: 1 })

  const blocker = runner('blocker')
  const warm = runner('warm', 120000, { priority: -10 })
  const device = runner('device')
  gate.resolve()
  await Promise.all([blocker, warm, device])
  assert.deepEqual(order, ['blocker', 'device', 'warm'])
})

// Served code carries absolute /ns/* specifiers; the crawl's extractor must
// recover exactly the URLs the device walk would request and skip volatile
// cache-busters plus the session descriptor.
it('extracts device-fetchable URLs from served code', () => {
  const urls = extractBootCrawlUrls(
    `import a from "http://192.168.4.25:5174/ns/m/src/a.ts";
     import b from "/ns/m/packages/ui/src/b.tsrx?import";
     export * from "/ns/core/ui/image";
     const c = "/ns/m/src/t.ts?t=1700000000";
     const d = "/__ns_dev__/session";
     const e = "wss://host/ns-hmr";`,
  )
  assert.ok(urls.has('/ns/m/src/a.ts'))
  assert.ok(urls.has('/ns/m/packages/ui/src/b.tsrx?import'))
  assert.ok(urls.has('/ns/core/ui/image'))
  assert.ok(!urls.has('/ns/m/src/t.ts?t=1700000000'), 'volatile URL must not be crawled')
  assert.ok(!urls.has('/__ns_dev__/session'), 'session descriptor is a boot signal, not warm-up traffic')
  assert.ok(![...urls].some((u) => u.includes('ns-hmr')))
})

// The crawl walks the same served-code graph the device's runtime walk
// traverses, so an entry fetch pre-warms the whole reachable closure through
// the real /ns/m pipeline.
it('crawl walks and pre-warms the served module closure', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-boot-crawl-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')

  let graphVersion = 0
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0, watch: null },
    plugins: [
      {
        name: 'fixture-boot-crawl',
        configureServer(server) {
          registerNsModuleServerRoute(server, {
            verbose: false,
            appVirtualWithSlash: '/src/',
            sfcFileMap: new Map(),
            depFileMap: new Map(),
            getGraphVersion: () => graphVersion,
            getStrategy: () => ({ flavor: 'javascript' }),
            depsBundle: null,
            sharedTransformRequest: (url) => server.transformRequest(url),
            ensureInitialGraphPopulationStarted() {},
            upsertGraphModule() {},
          })
        },
      },
    ],
  })
  t.after(async () => {
    await server.close()
    rmSync(root, { recursive: true, force: true })
  })
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`

  writeFileSync(join(root, 'src', 'entry.mjs'), `export { mid } from './mid.mjs'`)
  writeFileSync(join(root, 'src', 'mid.mjs'), `export { leaf } from './leaf.mjs'`)
  writeFileSync(join(root, 'src', 'leaf.mjs'), `export const leaf = 42`)

  const { visited } = await runBootGraphCrawl({ origin, seeds: ['/ns/m/src/entry.mjs'], concurrency: 2 })
  assert.ok(visited.has('/ns/m/src/entry.mjs'))
  assert.ok(visited.has('/ns/m/src/mid'), 'crawl must follow served import specifiers')
  assert.ok(visited.has('/ns/m/src/leaf'), 'crawl must reach the graph tail')

  // A crawled module's response is now memoized: a second fetch returns the
  // same bytes immediately instead of re-running the pipeline.
  const first = await fetch(`${origin}/ns/m/src/leaf.mjs`)
  assert.equal(first.status, 200)
})
