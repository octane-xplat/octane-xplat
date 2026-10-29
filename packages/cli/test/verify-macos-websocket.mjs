// Runtime check for globalThis.WebSocket in the AppKit JavaScriptCore host.
// Spawns a real RFC 6455 echo server plus the prebuilt host running the
// shipped shim, then asserts the negotiated handshake, text/binary echo,
// peer-initiated and local close codes, the failure path, and constructor
// validation. Apple Silicon macOS only; skips elsewhere.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	macOSHostArch,
	hostBundle,
	hostRoot,
} from '../src/macos/jsc-host/runtime.ts'
import { macOSExecutable } from '../src/macos/executables.ts'

if (process.platform !== 'darwin' || (process.arch !== 'arm64' && process.arch !== 'x64')) {
	console.log('macos-websocket verify skipped: Apple Silicon macOS only')
	process.exit(0)
}

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/macos-websocket-'))

// Minimal RFC 6455 server: echoes text/binary, echoes close frames, and sends
// a 1000/'bye' close when a text frame says "server-close".
const serverEvents = []
const server = createServer()
server.on('upgrade', (req, socket) => {
	serverEvents.push(['upgrade', req.url])
	const accept = createHash('sha1')
		.update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
		.digest('base64')
	const protocol = req.headers['sec-websocket-protocol']
	socket.write(
		'HTTP/1.1 101 Switching Protocols\r\n' +
			'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
			`Sec-WebSocket-Accept: ${accept}\r\n` +
			(protocol ? `Sec-WebSocket-Protocol: ${protocol.split(',')[0].trim()}\r\n` : '') +
			'\r\n',
	)
	let buffer = Buffer.alloc(0)
	let waitingForClose = false
	socket.on('data', (chunk) => {
		buffer = Buffer.concat([buffer, chunk])
		for (;;) {
			if (buffer.length < 2) {
				return
			}

			const opcode = buffer[0] & 0x0f
			const masked = buffer[1] & 0x80
			let length = buffer[1] & 0x7f
			let offset = 2
			if (length === 126) {
				if (buffer.length < 4) {
					return
				}

				length = buffer.readUInt16BE(2)
				offset = 4
			} else if (length === 127) {
				if (buffer.length < 10) {
					return
				}

				length = Number(buffer.readBigUInt64BE(2))
				offset = 10
			}

			const maskOffset = offset
			if (masked) {
				offset += 4
			}

			if (buffer.length < offset + length) {
				return
			}

			let payload = buffer.subarray(offset, offset + length)
			if (masked) {
				const mask = buffer.subarray(maskOffset, maskOffset + 4)
				payload = Buffer.from(payload.map((b, i) => b ^ mask[i % 4]))
			}

			buffer = buffer.subarray(offset + length)

			const frame = (op, data) => {
				const head = Buffer.alloc(10)
				head[0] = 0x80 | op
				let headLength
				if (data.length < 126) {
					head[1] = data.length
					headLength = 2
				} else if (data.length < 65536) {
					head[1] = 126
					head.writeUInt16BE(data.length, 2)
					headLength = 4
				} else {
					head[1] = 127
					head.writeBigUInt64BE(BigInt(data.length), 2)
					headLength = 10
				}
				socket.write(Buffer.concat([head.subarray(0, headLength), data]))
			}

			if (opcode === 0x8) {
				serverEvents.push(['close-in', payload.length >= 2 ? payload.readUInt16BE(0) : null])
				if (waitingForClose) {
					socket.end()
					return
				}

				frame(0x8, payload)
				socket.end()
				return
			}

			if (opcode === 0x9) {
				frame(0xa, payload)
				continue
			}

			if (opcode !== 0x1 && opcode !== 0x2) {
				continue
			}

			serverEvents.push([opcode === 0x1 ? 'text' : 'binary', payload.toString('utf8')])
			if (opcode === 0x1 && payload.toString('utf8') === 'server-close') {
				const body = Buffer.alloc(2 + 3)
				body.writeUInt16BE(1000, 0)
				body.write('bye', 2)
				frame(0x8, body)
				waitingForClose = true
				continue
			}

			frame(opcode, payload)
		}
	})
	socket.on('error', () => {})
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port

const fixture = join(app, 'fixture.cjs')
await writeFile(
	fixture,
	`var app = NSApplication.sharedApplication;
var events = [];
function finish() {
	console.log('RESULT ' + JSON.stringify(events));
	globalThis.__xplatStopHost();
}
function validations() {
	try { new WebSocket('http://x/'); events.push('bad-url missed'); }
	catch (e) { events.push('bad-url'); }
	try { new WebSocket('ws://127.0.0.1:${port}/', ['a', 'a']); events.push('bad-proto missed'); }
	catch (e) { events.push('bad-proto'); }
	var dead = new WebSocket('ws://127.0.0.1:1/');
	try { dead.send('x'); events.push('send-conn missed'); }
	catch (e) { events.push('send-conn'); }
	dead.onerror = function () { events.push('err-ev'); };
	dead.onclose = function (ev) { events.push('close3 ' + ev.code + ' ' + ev.wasClean); finish(); };
}
var ws = new WebSocket('ws://127.0.0.1:${port}/socket', ['chat', 'super']);
events.push('ready ' + ws.readyState);
ws.addEventListener('open', function () { events.push('listener-open'); });
ws.onopen = function () {
	events.push('open ' + ws.protocol + ' ' + ws.readyState);
	ws.send('hello');
	ws.send(new Uint8Array([104, 105]));
	ws.send('server-close');
};
ws.onmessage = function (ev) {
	var value = typeof ev.data === 'string'
		? 'text ' + ev.data
		: 'binary ' + Array.from(new Uint8Array(ev.data)).join(',');
	events.push('msg ' + value);
};
ws.onerror = function () { events.push('error1'); };
ws.onclose = function (ev) {
	events.push('close ' + ev.code + ' ' + ev.reason + ' ' + ev.wasClean);
	var ws2 = new WebSocket('ws://127.0.0.1:${port}/');
	ws2.onopen = function () {
		events.push('open2');
		ws2.close(3000, 'done');
		events.push('after-close ' + ws2.readyState);
	};
	ws2.onclose = function (ev2) {
		events.push('close2 ' + ev2.code + ' ' + ev2.reason + ' ' + ev2.wasClean);
		validations();
	};
	ws2.onerror = function () { events.push('error2'); };
};
setTimeout(function () { events.push('TIMEOUT'); finish(); }, 15000);
`,
)

// The shipped shim is the WebSocket implementation under test.
await writeFile(join(app, 'bootstrap.js'), await readFile(join(hostRoot, 'shim.js'), 'utf8'))

const child = spawn(
	await macOSExecutable(app, 'macos/host'),
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		fixture,
		join(hostBundle, `metadata.macos.${macOSHostArch()}.nsmd`),
		join(app, 'bootstrap.js'),
	],
	{ stdio: ['ignore', 'ignore', 'pipe'] },
)

let output = ''
child.stderr.on('data', (chunk) => {
	output += chunk
})

const status = await new Promise((resolve) => child.on('close', resolve))
server.close()

assert.equal(status, 0, output)
const result = /RESULT (.+)/.exec(output)?.[1]
assert.ok(result, `fixture did not report:\n${output}`)
assert.deepEqual(JSON.parse(result), [
	'ready 0',
	'open chat 1',
	'listener-open',
	'msg text hello',
	'msg binary 104,105',
	'close 1000 bye true',
	'open2',
	'after-close 2',
	'close2 3000 done true',
	'bad-url',
	'bad-proto',
	'send-conn',
	'err-ev',
	'close3 1006 false',
])

assert.deepEqual(serverEvents, [
	['upgrade', '/socket'],
	['text', 'hello'],
	['binary', 'hi'],
	['text', 'server-close'],
	['close-in', 1000],
	['upgrade', '/'],
	['close-in', 3000],
])

console.log(
	'MACOS_WEBSOCKET_OK: handshake, subprotocol, text/binary echo, close codes, failure path',
)
