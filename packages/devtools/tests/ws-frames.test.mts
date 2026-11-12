import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	base64Encode,
	encodeFrame,
	FrameDecoder,
	handshakeAccept,
	handshakeRequest,
	utf8Decode,
	utf8Encode,
} from '../src/macos/ws-frames.ts'

// Unmasked server frames for decoder tests.
function serverFrame(opcode, payload, fin = true) {
	const header = [fin ? 0x80 | opcode : opcode]
	const len = payload.length
	if (len < 126) {
		header.push(len)
	} else if (len < 65536) {
		header.push(126, len >> 8, len & 0xff)
	} else {
		header.push(127)
		for (let s = 56; s >= 0; s -= 8) {
			header.push((len / 2 ** s | 0) & 0xff)
		}
	}
	const out = new Uint8Array(header.length + len)
	out.set(header, 0)
	out.set(payload, header.length)
	return out
}
const bytes = (s) => utf8Encode(s)

test('handshake request + accept edge cases', () => {
	const req = utf8Decode(handshakeRequest('127.0.0.1', '5200', '/__octane_devtools?token=x'))
	assert.match(req, /^GET \/__octane_devtools\?token=x HTTP\/1\.1\r\n/)
	assert.match(req, /Upgrade: websocket/)
	const resp = utf8Encode('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\n\r\n')
	assert.equal(handshakeAccept(resp), resp.length)
	assert.equal(handshakeAccept(resp.subarray(0, 10)), -1)
	assert.throws(() => handshakeAccept(utf8Encode('HTTP/1.1 401 Unauthorized\r\n\r\n')), /401|rejected/)
})

test('utf8/base64 helpers roundtrip', () => {
	assert.equal(utf8Decode(utf8Encode('héllo 😀')), 'héllo 😀')
	assert.equal(base64Encode(utf8Encode('hi')), 'aGk=')
})

test('client frames are masked; payload round-trips', () => {
	const f = encodeFrame(1, utf8Encode('x'), utf8Encode('\x01\x02\x03\x04'))
	assert.equal(f[0], 0x81)
	assert.equal(f[1], 0x80 | 1)
	assert.equal(f[6], 'x'.charCodeAt(0) ^ 1)
})

test('frame split across chunks; several frames per chunk', () => {
	const d = new FrameDecoder()
	const f = serverFrame(1, utf8Encode('{"a":1}'))
	const evs = [...d.push(f.subarray(0, 3)), ...d.push(f.subarray(3))]
	assert.deepEqual(evs, [{ type: 'text', data: '{"a":1}' }])
	const two = new Uint8Array(f.length * 2)
	two.set(f, 0); two.set(f, f.length)
	assert.deepEqual(new FrameDecoder().push(two), [
		{ type: 'text', data: '{"a":1}' },
		{ type: 'text', data: '{"a":1}' },
	])
})

test('16-bit and 64-bit payload lengths', () => {
	const d = new FrameDecoder()
	const p200 = new Uint8Array(200).fill(97)
	assert.deepEqual(d.push(serverFrame(1, p200)).length, 1)
	const big = new Uint8Array(70000).fill(98)
	const evs = d.push(serverFrame(1, big))
	assert.equal(evs.length, 1)
	assert.equal(evs[0].type === 'text' && evs[0].data.length, 70000)
})

test('ping → pong event; close event', () => {
	const d = new FrameDecoder()
	assert.deepEqual(d.push(serverFrame(9, bytes('p'))), [{ type: 'ping', payload: bytes('p') }])
	assert.deepEqual(d.push(serverFrame(8, new Uint8Array(0))), [{ type: 'close' }])
	assert.deepEqual(d.push(serverFrame(10, bytes('q'))), [{ type: 'pong', payload: bytes('q') }])
})

test('fragmented continuation frames reassemble', () => {
	const d = new FrameDecoder()
	const p1 = utf8Encode('{"hello":')
	const p2 = utf8Encode('"world"}')
	const evs = [
		...d.push(serverFrame(1, p1, false)),
		...d.push(serverFrame(0, p2, true)),
	]
	assert.deepEqual(evs, [{ type: 'text', data: '{"hello":"world"}' }])
	assert.throws(() => new FrameDecoder().push(serverFrame(0, bytes('x'))), /continuation/)
})

test('multibyte UTF-8 split across a chunk boundary', () => {
	const d = new FrameDecoder()
	const f = serverFrame(1, utf8Encode('€😀z'))
	for (let i = 0; i < f.length; i++) {
		d.push(f.subarray(i, i + 1))
	}
	assert.deepEqual(d.push(new Uint8Array(0)), [])
	const d2 = new FrameDecoder()
	assert.deepEqual(d2.push(f), [{ type: 'text', data: '€😀z' }])
})

test('masked server frame fails loudly', () => {
	const d = new FrameDecoder()
	const masked = encodeFrame(1, bytes('x'))
	assert.throws(() => d.push(masked), /masked/)
})
