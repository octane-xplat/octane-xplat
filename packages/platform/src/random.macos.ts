// OS CSPRNG — macOS leaf. SecRandomCopyBytes binds through the AppKit/JSC
// host's C-function metadata and fills an NSMutableData buffer in place;
// verified on the prebuilt host (status 0, real bytes out).
import type { RandomImpl } from './types'

declare const NSMutableData: any
declare const SecRandomCopyBytes: any
declare const kSecRandomDefault: any
declare const interop: any

const ready = () =>
	typeof SecRandomCopyBytes === 'function' &&
	typeof NSMutableData !== 'undefined' &&
	typeof interop !== 'undefined'

export const random: RandomImpl = {
	get supported() {
		return ready()
	},
	fill(view) {
		if (!ArrayBuffer.isView(view)) {
			throw new TypeError('random.fill: expected an ArrayBufferView')
		}

		const target = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
		if (target.length === 0) {
			return view
		}

		if (!ready()) {
			throw new Error('random: SecRandomCopyBytes unavailable on this host')
		}

		const data = NSMutableData.dataWithLength(target.length)
		// errSecSuccess = 0
		if (SecRandomCopyBytes(kSecRandomDefault, target.length, data.mutableBytes) !== 0) {
			throw new Error('random: SecRandomCopyBytes failed')
		}

		target.set(new Uint8Array(interop.bufferFromData(data)))
		return view
	},
	bytes(length) {
		if (!Number.isInteger(length) || length < 0) {
			throw new RangeError('random.bytes: length must be a non-negative integer')
		}

		return random.fill(new Uint8Array(length))
	},
}
