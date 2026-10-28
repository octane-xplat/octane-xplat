const samples = 8000 * 4
const bytes = Buffer.alloc(44 + samples * 2)
bytes.write('RIFF')
bytes.writeUInt32LE(bytes.length - 8, 4)
bytes.write('WAVEfmt ', 8)
bytes.writeUInt32LE(16, 16)
bytes.writeUInt16LE(1, 20)
bytes.writeUInt16LE(1, 22)
bytes.writeUInt32LE(8000, 24)
bytes.writeUInt32LE(16000, 28)
bytes.writeUInt16LE(2, 32)
bytes.writeUInt16LE(16, 34)
bytes.write('data', 36)
bytes.writeUInt32LE(samples * 2, 40)
export function audioResponse(request, response) {
	response.setHeader('access-control-allow-origin', '*')
	response.setHeader('accept-ranges', 'bytes')
	response.setHeader('content-type', 'audio/wav')
	let start = 0,
		end = bytes.length - 1
	if (request.headers.range) {
		const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range)
		if (!match) {
			response.writeHead(416)
			response.end()
			return
		}

		start = Number(match[1])
		end = match[2] ? Math.min(Number(match[2]), end) : end
		if (start > end) {
			response.writeHead(416)
			response.end()
			return
		}

		response.writeHead(206, {
			'content-range': `bytes ${start}-${end}/${bytes.length}`,
			'content-length': end - start + 1,
		})
	} else {
		response.writeHead(200, { 'content-length': bytes.length })
	}
	response.end(request.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1))
}
