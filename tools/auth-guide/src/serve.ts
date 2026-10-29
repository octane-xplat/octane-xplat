import { createServer } from 'node:http'
import { createApi } from './api.ts'

const issuer = process.env.AUTH_ISSUER
const audience = process.env.AUTH_AUDIENCE
if (!issuer || !audience) {
	throw new Error('Set AUTH_ISSUER and AUTH_AUDIENCE in the server .env')
}
const handle = createApi({ issuer, audience })
const server = createServer(async (req, res) => {
	try {
		const headers = new Headers()
		for (const [name, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				headers.set(name, Array.isArray(value) ? value.join(', ') : value)
			}
		}
		const request = new Request(`http://127.0.0.1:8788${req.url}`, {
			method: req.method,
			headers,
		})
		const response = await handle(request)
		res.writeHead(response.status, Object.fromEntries(response.headers))
		res.end(await response.text())
	} catch {
		res.writeHead(503, { 'Cache-Control': 'no-store' })
		res.end()
	}
})
server.listen(8788, '127.0.0.1', () => console.log('Guide API listening on 127.0.0.1:8788'))
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.once(signal, () => server.close())
}
