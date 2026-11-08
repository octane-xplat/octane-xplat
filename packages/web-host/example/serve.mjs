import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'

const client = fileURLToPath(new URL('./dist/client', import.meta.url))
const port = Number(process.env.PORT ?? 4174)

let server
if (process.env.STATIC === '1') {
  // Static-only deployment: files plus 404.html for unmatched URLs, without
  // ever loading the server bundle.
  const notFound = new URL('./dist/static/404.html', import.meta.url)
  server = serve({
    port,
    hostname: '127.0.0.1',
    middleware: [
      staticMiddleware({ dir: client }),
      staticMiddleware({ dir: fileURLToPath(new URL('./dist/static', import.meta.url)) }),
    ],
    fetch: async () =>
      new Response(await readFile(notFound), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
  })
} else {
  const { handle } = await import('./dist/server/server.web.js')
  server = serve({
    port,
    hostname: '127.0.0.1',
    middleware: [staticMiddleware({ dir: client })],
    fetch: handle,
  })
}

export { server }
await server.ready()
console.log(new URL('/products/coat', server.url).href)
