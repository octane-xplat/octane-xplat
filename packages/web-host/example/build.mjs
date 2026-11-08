import { build } from 'vite'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { octane } from 'octane/compiler/vite'
import { xplatCss } from '@octane-xplat/build/vite'
import { webHost } from '@octane-xplat/web-host/vite'
import { prerender } from '@octane-xplat/web-host/prerender'

const root = new URL('..', import.meta.url).pathname
const common = {
  root,
  configFile: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  resolve: { conditions: ['web'], extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'] },
}

// A normal browser build emits hashed assets and the manifest the server reads.
await build({
  ...common,
  plugins: [xplatCss('web'), webHost(), octane()],
  build: {
    outDir: 'example/dist/client',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: { input: root + '/example/client.web.ts' },
  },
})

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
  build: { ssr: root + '/example/server.web.ts', outDir: 'example/dist/server', emptyOutDir: true },
})

// Keep static HTML separate from client assets so only owned pages are replaced.
const { staticRenderer } = await import('./dist/server/server.web.js')

console.log(
  await prerender(staticRenderer, {
    origin: 'http://localhost:4174',
    outDir: root + '/example/dist/static',
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
