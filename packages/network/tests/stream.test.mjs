import * as options from '../src/options.ts'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
import { ReadableStream } from 'web-streams-polyfill'
import * as encoding from '@kayahr/text-encoding/no-encodings'
import { encode, decode } from '../src/base64.ts'

const load = async (file, imports = {}) => {
	const exports = {}
	vm.runInNewContext(
		ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
			module: ts.ModuleKind.CommonJS,
		}),
		{
			exports,
			require: (id) => {
				if (!(id in imports)) {
					throw Error(id)
				}
				return imports[id]
			},
			fetch,
			Uint8Array,
			AbortController,
			Map,
			Object,
		},
	)
	return exports
}

const response = await load('response', { './encoding': { Decoder: encoding.TextDecoder } })
const { requestNative } = await load('native', {
	'./options': options,
	'web-streams-polyfill': { ReadableStream },
	'./base64': { encode, decode },
	'./encoding': { Encoder: encoding.TextEncoder },
	'./response': response,
})

function bridge() {
	let callback,
		options,
		cancelled = false
	return {
		native: {
			start(value, event) {
				options = JSON.parse(value)
				callback = event
			},
			cancel() {
				cancelled = true
			},
		},
		emit: (value) => callback(JSON.stringify(value)),
		get cancelled() {
			return cancelled
		},
		get options() {
			return options
		},
	}
}

test('native response resolves at headers, preserves bytes across UTF-8 boundaries', async () => {
	const b = bridge()
	const request = requestNative(() => b.native, 'https://example.test/stream', {
		method: 'POST',
		body: 'é',
		headers: { authorization: 'synthetic-token' },
	})
	assert.equal(b.options.body, 'w6k=')
	b.emit({ type: 'headers', status: 200, headers: { 'Content-Type': 'application/x-ndjson' } })
	const result = await request
	assert.equal(result.headers.get('CONTENT-TYPE'), 'application/x-ndjson')
	const text = result.text()
	b.emit({ type: 'data', data: encode(new Uint8Array([0xc3])) })
	b.emit({ type: 'data', data: encode(new Uint8Array([0xa9, 10])) })
	b.emit({ type: 'end' })
	assert.equal(await text, 'é\n')
	assert.equal(b.cancelled, false)
})

test('abort after headers rejects a pending read and releases the request', async () => {
	const b = bridge(),
		abort = new AbortController()
	const request = requestNative(() => b.native, 'https://example.test/', { signal: abort.signal })
	b.emit({ type: 'headers', status: 200, headers: {} })
	const result = await request
	const text = result.text()
	abort.abort()
	await assert.rejects(text, { name: 'AbortError' })
	assert.equal(b.cancelled, true)
	b.emit({ type: 'data', data: 'AAAA' })
})

test('bounded unread data and midstream failures reject consumption', async () => {
	for (const event of [{ type: 'data', data: encode(new Uint8Array(5)) }, { type: 'error' }]) {
		const b = bridge()
		const request = requestNative(() => b.native, 'https://example.test/', { maxBufferedBytes: 4 })
		b.emit({ type: 'headers', status: 500, headers: {} })
		const result = await request
		assert.equal(result.ok, false)
		b.emit(event)
		await assert.rejects(result.text())
		assert.equal(b.cancelled, true)
	}
})

test('consumer cancellation and redirects release the backend', async () => {
	const b = bridge()
	const request = requestNative(() => b.native, 'https://example.test/')
	b.emit({ type: 'headers', status: 200, headers: {} })
	const result = await request
	await result.body.cancel()
	assert.equal(b.cancelled, true)
	const redirect = bridge()
	const rejected = requestNative(() => redirect.native, 'https://example.test/')
	redirect.emit({ type: 'headers', status: 302, headers: { location: 'https://other.test/' } })
	await assert.rejects(rejected, /redirect/)
	assert.equal(redirect.cancelled, true)
})

test('browser transport delivers bytes before server completion and sends binary PUT exactly', async () => {
	let finished = false,
		received
	const server = createServer(async (request, response) => {
		if (request.method === 'HEAD') {
			response.writeHead(204)
			response.end()
		} else if (request.method === 'PUT') {
			const chunks = []
			for await (const chunk of request) {
				chunks.push(chunk)
			}

			received = Buffer.concat(chunks)
			response.end('{"ok":true}')
		} else {
			response.writeHead(200, { 'content-type': 'application/x-ndjson' })
			response.write('{"text":"é"}\n')
			setTimeout(() => {
				finished = true
				response.end('{"done":true}\n')
			}, 150)
		}
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	try {
		const { requestStream } = await load('index.web', {
			'./response': response,
			'./options': options,
			'web-streams-polyfill': { ReadableStream },
		})

		const url = `http://127.0.0.1:${server.address().port}`
		const empty = await requestStream(url, { method: 'HEAD' })
		assert.equal(empty.status, 204)
		assert.equal(await empty.text(), '')
		const result = await requestStream(url)
		const reader = result.body.getReader()
		const first = await reader.read()
		assert.equal(finished, false)
		assert.match(new TextDecoder().decode(first.value), /é/)
		await reader.cancel()
		reader.releaseLock()
		const bytes = new Uint8Array([0, 255, 1, 127])
		const uploaded = await requestStream(url, { method: 'PUT', body: bytes })
		assert.equal((await uploaded.json()).ok, true)
		assert.deepEqual(received, Buffer.from(bytes))
	} finally {
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
	}
})

test('Rouzer NDJSON decodes incrementally across split UTF-8 and reports malformed lines', async () => {
	const { decodeNdjson } = await import('rouzer/ndjson')
	const b = bridge()
	const request = requestNative(() => b.native, 'https://example.test/stream')
	b.emit({ type: 'headers', status: 200, headers: { 'content-type': 'application/x-ndjson' } })
	const result = await request
	const values = decodeNdjson(result.body)[Symbol.asyncIterator]()
	const first = values.next()
	const bytes = new TextEncoder().encode('{"text":"é"}\n')
	const split = bytes.indexOf(0xc3) + 1
	b.emit({ type: 'data', data: encode(bytes.slice(0, split)) })
	b.emit({ type: 'data', data: encode(bytes.slice(split)) })
	assert.equal((await first).value.text, 'é')
	const invalid = values.next()
	b.emit({ type: 'data', data: encode(new TextEncoder().encode('invalid\n')) })
	await assert.rejects(invalid, /line 2/)
	assert.equal(b.cancelled, true)
	const truncated = new ReadableStream({
		start(controller) {
			controller.enqueue(new TextEncoder().encode('{"text":'))
			controller.close()
		},
	})
	await assert.rejects(async () => {
		for await (const value of decodeNdjson(truncated)) {
			void value
		}
	}, /line 1/)
})

test('transport byte conversion matches standard base64 for binary lengths', () => {
	for (const length of [0, 1, 2, 3, 4, 16384]) {
		const input = Uint8Array.from({ length }, (_, i) => i % 256)
		assert.equal(encode(input), Buffer.from(input).toString('base64'))
		assert.deepEqual(decode(encode(input)), input)
	}
	assert.throws(() => decode('%%%='), /Invalid/)
})
