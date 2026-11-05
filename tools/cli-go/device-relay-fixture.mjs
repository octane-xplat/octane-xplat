// Test-only upstream: real WebSocket framing without adding a server dependency.
import { writeFileSync } from 'node:fs'
const [, , ready, requests] = process.argv
const seen = []
const server = Bun.serve({
	hostname: '127.0.0.1', port: 0,
	fetch(request, server) {
		if (seen.length >= 64) {return new Response('Fixture request bound', { status: 503 })}
		const url = new URL(request.url)
		const record = { path: url.pathname + url.search, origin: request.headers.get('origin') }
		seen.push(record)
		writeFileSync(requests, JSON.stringify(seen))
		if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
			return server.upgrade(request) ? undefined : new Response('Upgrade refused', { status: 400 })
		}
		return Response.json(record)
	},
	websocket: { message(socket, data) { socket.send(data) } },
})
writeFileSync(ready, JSON.stringify({ port: server.port }))
process.on('SIGTERM', () => { server.stop(true); process.exit(0) })
