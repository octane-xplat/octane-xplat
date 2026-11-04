// Private config-dependency registry: qualify this source release before publish.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { createHash } from 'node:crypto'
const { archive, version, ready, requests } = JSON.parse(readFileSync(process.argv[2]))
const bytes = readFileSync(archive)
const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64')
const seen = []
const server = createServer((request, response) => {
	const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
	if (request.method !== 'GET' || seen.length >= 32) {
		response.writeHead(400).end()
		return
	}
	seen.push(path)
	writeFileSync(requests, JSON.stringify(seen))
	if (path === '/patches.tgz') {
		response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(bytes)
	} else if (path === '/@octane-xplat/patches') {
		const name = '@octane-xplat/patches'
		response.writeHead(200, { 'content-type': 'application/json' }).end(
			JSON.stringify({
				name,
				'dist-tags': { latest: version },
				time: { [version]: '2020-01-01T00:00:00Z' },
				versions: {
					[version]: {
						name,
						version,
						dist: { integrity, tarball: `http://127.0.0.1:${server.address().port}/patches.tgz` },
					},
				},
			}),
		)
	} else {
		response.writeHead(404).end()
	}
})

server.requestTimeout = 10000
server.listen(0, '127.0.0.1', () => {
	writeFileSync(ready + '.tmp', JSON.stringify({ port: server.address().port, integrity }))
	renameSync(ready + '.tmp', ready)
})
