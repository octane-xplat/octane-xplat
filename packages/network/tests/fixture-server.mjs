let finished = false
export const networkResponse = async (request, response) => {
	response.setHeader('access-control-allow-origin', '*')
	response.setHeader('access-control-allow-methods', 'GET, PUT, POST, OPTIONS')
	response.setHeader('access-control-allow-headers', 'content-type, x-fixture, authorization')
	if (request.method === 'OPTIONS') {
		response.writeHead(204)
		response.end()
		return
	}
	if (request.url === '/upload') {
		const chunks = []
		for await (const chunk of request) {
			chunks.push(chunk)
		}

		response.end(
			JSON.stringify({
				bytes: Array.from(Buffer.concat(chunks)),
				header: request.headers['x-fixture'],
			}),
		)
	} else if (request.url === '/failure') {
		response.writeHead(503)
		response.end('{"unavailable":true}')
	} else if (request.url === '/state') {
		response.end(JSON.stringify({ finished }))
	} else {
		finished = false
		response.writeHead(200, { 'content-type': 'application/x-ndjson' })
		const record = Buffer.from('{"text":"é"}\n')
		const split = record.indexOf(0xc3) + 1
		response.write(record.subarray(0, split))
		const nextChunk = setTimeout(() => response.write(record.subarray(split)), 100)
		const timer = setTimeout(() => {
			finished = true
			response.end('{"done":true}\n')
		}, 3000)

		response.on('close', () => {
			clearTimeout(timer)
			clearTimeout(nextChunk)
		})
	}
}
