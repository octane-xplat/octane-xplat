// Pure WebSocket framing: handshake request/accept, masked client frame
// encoding, and an incremental decoder (chunked input, fragmented
// continuation frames, 16/64-bit lengths). No host APIs — node --test-able.

export function utf8Encode(s: string): Uint8Array {
	const out = new Uint8Array(s.length * 4)
	let n = 0
	for (let i = 0; i < s.length; i++) {
		let c = s.charCodeAt(i)
		if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
			c = 0x10000 + ((c - 0xd800) << 10) + (s.charCodeAt(++i) - 0xdc00)
		}
		if (c < 0x80) out[n++] = c
		else if (c < 0x800) {
			out[n++] = 0xc0 | (c >> 6)
			out[n++] = 0x80 | (c & 0x3f)
		} else if (c < 0x10000) {
			out[n++] = 0xe0 | (c >> 12)
			out[n++] = 0x80 | ((c >> 6) & 0x3f)
			out[n++] = 0x80 | (c & 0x3f)
		} else {
			out[n++] = 0xf0 | (c >> 18)
			out[n++] = 0x80 | ((c >> 12) & 0x3f)
			out[n++] = 0x80 | ((c >> 6) & 0x3f)
			out[n++] = 0x80 | (c & 0x3f)
		}
	}
	return out.subarray(0, n)
}

export function utf8Decode(bytes: Uint8Array): string {
	let s = ''
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i]
		if (b < 0x80) s += String.fromCharCode(b)
		else if (b < 0xe0) {
			s += String.fromCharCode(((b & 0x1f) << 6) | (bytes[++i] & 0x3f))
		} else if (b < 0xf0) {
			s += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[++i] & 0x3f) << 6) | (bytes[++i] & 0x3f))
		} else {
			const cp =
				((b & 0x07) << 18) |
				((bytes[++i] & 0x3f) << 12) |
				((bytes[++i] & 0x3f) << 6) |
				(bytes[++i] & 0x3f)
			s += String.fromCharCode(0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff))
		}
	}
	return s
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
export function base64Encode(bytes: Uint8Array): string {
	let out = ''
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2]
		out += B64[a >> 2] + B64[((a & 3) << 4) | ((b ?? 0) >> 4)] +
			(b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)]) +
			(c === undefined ? '=' : B64[c & 63])
	}
	return out
}

export function handshakeRequest(host: string, port: string, path: string): Uint8Array {
	const key = base64Encode(utf8Encode(`${Date.now()}${Math.random()}`).subarray(0, 16))
	const request =
		`GET ${path} HTTP/1.1\r\nHost: ${host}:${port}\r\nUpgrade: websocket\r\n` +
		`Connection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
	return utf8Encode(request)
}

// Returns the byte offset past the headers on 101, or -1 when incomplete,
// or throws on a rejected upgrade.
export function handshakeAccept(buffer: Uint8Array): number {
	const text = utf8Decode(buffer)
	const end = text.indexOf('\r\n\r\n')
	if (end < 0) return -1
	const status = /^HTTP\/[\d.]+ (\d+)/.exec(text)?.[1]
	if (status !== '101') {
		throw new Error(`websocket upgrade rejected: ${text.slice(0, end)}`)
	}
	return end + 4
}

export type FrameEvent =
	| { type: 'text'; data: string }
	| { type: 'close' }
	| { type: 'ping'; payload: Uint8Array }
	| { type: 'pong'; payload: Uint8Array }

export function encodeFrame(
	opcode: number,
	payload: Uint8Array,
	maskKey?: Uint8Array,
): Uint8Array {
	const mask = maskKey ?? new Uint8Array(4)
	if (!maskKey) for (let i = 0; i < 4; i++) mask[i] = (Math.random() * 256) | 0
	const len = payload.length
	const header: number[] = [0x80 | opcode]
	if (len < 126) header.push(0x80 | len)
	else if (len < 65536) header.push(0x80 | 126, len >> 8, len & 0xff)
	else {
		header.push(0x80 | 127)
		for (let s = 56; s >= 0; s -= 8) header.push((len / 2 ** s | 0) & 0xff)
	}
	const out = new Uint8Array(header.length + 4 + len)
	out.set(header, 0)
	out.set(mask, header.length)
	for (let i = 0; i < len; i++) out[header.length + 4 + i] = payload[i] ^ mask[i & 3]
	return out
}

// Incremental server→client decoder. Server frames arrive unmasked; control
// frames are never fragmented; data frames may fragment — continuation
// payloads accumulate until FIN.
export class FrameDecoder {
	private buffer = new Uint8Array(0)
	private fragments: Uint8Array[] = []
	private fragmentOpcode = -1

	push(chunk: Uint8Array): FrameEvent[] {
		const merged = new Uint8Array(this.buffer.length + chunk.length)
		merged.set(this.buffer, 0)
		merged.set(chunk, this.buffer.length)
		this.buffer = merged
		const events: FrameEvent[] = []
		for (;;) {
			if (this.buffer.length < 2) return events
			const b = this.buffer
			const fin = (b[0] & 0x80) !== 0
			const opcode = b[0] & 0x0f
			if (b[1] & 0x80) throw new Error('masked server frame')
			const len0 = b[1] & 0x7f
			const off = len0 < 126 ? 2 : len0 === 126 ? 4 : 10
			let len = len0
			if (len0 === 126) len = (b[2] << 8) | b[3]
			else if (len0 === 127) {
				const n =
					(BigInt(b[2]) << 56n) | (BigInt(b[3]) << 48n) | (BigInt(b[4]) << 40n) |
					(BigInt(b[5]) << 32n) | (BigInt(b[6]) << 24n) | (BigInt(b[7]) << 16n) |
					(BigInt(b[8]) << 8n) | BigInt(b[9])
				len = Number(n)
			}
			if (this.buffer.length < off + len) return events
			const payload = b.subarray(off, off + len)
			this.buffer = b.subarray(off + len)

			if (opcode === 0) {
				if (this.fragmentOpcode < 0) throw new Error('continuation without start')
				this.fragments.push(payload)
				if (fin) {
					const total = this.fragments.reduce((n, f) => n + f.length, 0)
					const joined = new Uint8Array(total)
					let o = 0
					for (const f of this.fragments) { joined.set(f, o); o += f.length }
					this.fragments = []
					if (this.fragmentOpcode === 1) events.push({ type: 'text', data: utf8Decode(joined) })
					this.fragmentOpcode = -1
				}
			} else if (opcode === 1) {
				if (fin) events.push({ type: 'text', data: utf8Decode(payload) })
				else {
					this.fragmentOpcode = 1
					this.fragments = [payload]
				}
			} else if (opcode === 8) events.push({ type: 'close' })
			else if (opcode === 9) events.push({ type: 'ping', payload })
			else if (opcode === 10) events.push({ type: 'pong', payload })
		}
	}
}
