// OS CSPRNG — web leaf (also serves the Linux system-webview target, whose
// resolver accepts .web leaves). crypto.getRandomValues is the browser
// CSPRNG; `crypto` can be absent in unusual embeddings, hence `supported`.
import type { RandomImpl } from './types'

const source = () =>
	typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function' ? crypto : null

export const random: RandomImpl = {
	get supported() {
		return source() !== null
	},
	fill(view) {
		if (!ArrayBuffer.isView(view)) {
			throw new TypeError('random.fill: expected an ArrayBufferView')
		}

		const crypto = source()
		if (!crypto) {
			throw new Error('random: crypto.getRandomValues is unavailable')
		}

		// getRandomValues caps a single call at 64 KiB — chunk larger fills.
		const target = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
		for (let offset = 0; offset < target.length; offset += 65536) {
			const chunk = new Uint8Array(new ArrayBuffer(Math.min(65536, target.length - offset)))
			crypto.getRandomValues(chunk)
			target.set(chunk, offset)
		}

		return view
	},
	bytes(length) {
		if (!Number.isInteger(length) || length < 0) {
			throw new RangeError('random.bytes: length must be a non-negative integer')
		}

		return random.fill(new Uint8Array(length))
	},
}
