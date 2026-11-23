import { build } from 'vite'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { octane } from 'octane/compiler/vite'
import { css } from '@octane-xplat/build/vite'
import { webHost } from '@octane-xplat/web-host/vite'
import { prerender } from '@octane-xplat/web-host/prerender'

const root = fileURLToPath(new URL('.', import.meta.url))
const common = {
  root,
  configFile: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  resolve: { conditions: ['web'], extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'] },
}

// 1. Build browser assets and the manifest the server reads.
await build({
  ...common,
  plugins: [css('web'), webHost(), octane()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: { input: root + '/client.web.ts' },
  },
})

// 2. Build the server entry against the same route catalog.
await build({
  ...common,
  plugins: [webHost(), octane()],
  ssr: {
    noExternal: [
      '@octane-xplat/web-host',
      '@octane-xplat/ui',
      '@octane-xplat/lib',
      '@octane-xplat/platform',
    ],
  },
  build: { ssr: root + '/server.web.ts', outDir: 'dist/server', emptyOutDir: true },
})

// 3. Generate static HTML separately from the client assets.
const { staticRenderer } = await import('./dist/server/server.web.js')

console.log(
  await prerender(staticRenderer, {
    origin: 'http://localhost:4174',
    outDir: root + '/dist/static',
    cacheFile: root + '/node_modules/.cache/example-prerender.json',
    revision: createHash('sha256')
      .update(await readFile(new URL('./dist/server/server.web.js', import.meta.url)))
      .digest('hex'),
    paths: [
      { destination: { to: '/' }, key: 'home-v1' },
      ...['coat', 'hat'].map((id) => ({
        destination: { to: '/products/:id', params: { id } },
        key: `product-${id}-v1`,
      })),
    ],
    notFound: { destination: { to: '/*', params: { '*': '404' } }, key: 'not-found-v1' },
  }),
)
