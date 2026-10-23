import { fileURLToPath } from 'node:url'
import { serve } from 'srvx'
import { staticMiddleware } from 'srvx/static'
import { handle } from './dist/server/server.web.js'

export const server = serve({
	port: Number(process.env.PORT ?? 4174),
	hostname: '127.0.0.1',
	middleware: [
		staticMiddleware({ dir: fileURLToPath(new URL('./dist/client', import.meta.url)) }),
		...(process.env.STATIC === '1'
			? [staticMiddleware({ dir: fileURLToPath(new URL('./dist/static', import.meta.url)) })]
			: []),
	],
	fetch: handle,
})

await server.ready()
console.log(new URL('/products/coat', server.url).href)
