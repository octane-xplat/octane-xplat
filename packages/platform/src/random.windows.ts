import { Windows } from '@octane-xplat/platform/windows'
import type { RandomImpl } from './types'

const source = () => Windows?.Security?.Cryptography?.CryptographicBuffer

/** Windows OS entropy through WinRT; never falls back to a JS PRNG. */
export const random: RandomImpl = {
	get supported() {
		const api = source()
		return typeof api?.GenerateRandom === 'function' && typeof api?.EncodeToHexString === 'function'
	},
	fill(view) {
		if (!ArrayBuffer.isView(view)) {
			throw new TypeError('random.fill: expected an ArrayBufferView')
		}
		const target = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
		if (!target.length) {
			return view
		}
		if (!random.supported) {
			throw new Error('random: no OS CSPRNG bound on this target')
		}
		const api = source()
		// Hex avoids a projected byte[] out parameter. Bound each temporary string.
		for (let offset = 0; offset < target.length; offset += 65536) {
			const length = Math.min(65536, target.length - offset)
			const hex = String(api.EncodeToHexString(api.GenerateRandom(length)))
			if (hex.length !== length * 2 || !/^[\da-f]+$/i.test(hex)) {
				throw new Error('random: invalid CryptographicBuffer result')
			}

			for (let index = 0; index < length; index++) {
				target[offset + index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
			}
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
