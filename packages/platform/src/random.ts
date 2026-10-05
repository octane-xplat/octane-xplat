// OS CSPRNG — native leaf. iOS fills from SecRandomCopyBytes
// (Security.framework); Android fills a java byte[] via
// java.security.SecureRandom. Windows' pinned core build binds neither —
// `supported` reports false there rather than weaken the entropy source.
import { Application } from '@nativescript/core'
import type { RandomImpl } from './types'

// Bound by the runtime's interop metadata; declared locally so target
// typechecks without iOS/Android ambient types (windows) still compile.
declare const NSMutableData: any
declare const SecRandomCopyBytes: any
declare const kSecRandomDefault: any
declare const interop: any
declare const java: any

const iosReady = () =>
	Application.ios != null &&
	typeof SecRandomCopyBytes === 'function' &&
	typeof NSMutableData !== 'undefined'

const androidReady = () =>
	Application.android != null &&
	typeof java !== 'undefined' &&
	typeof (Array as any).create === 'function'

let secureRandom: any

function fillBytes(target: Uint8Array): void {
	if (target.length === 0) {
		return
	}

	if (iosReady()) {
		const data = NSMutableData.dataWithLength(target.length)
		// errSecSuccess = 0
		if (SecRandomCopyBytes(kSecRandomDefault, target.length, data.mutableBytes) !== 0) {
			throw new Error('random: SecRandomCopyBytes failed')
		}

		target.set(new Uint8Array(interop.bufferFromData(data)))
		return
	}

	if (androidReady()) {
		secureRandom ??= new java.security.SecureRandom()
		// NativeScript's Array.create allocates a real java byte[].
		const buffer = (Array as any).create('byte', target.length)
		secureRandom.nextBytes(buffer)
		// Java bytes are signed; Uint8Array assignment wraps them to 0–255.
		for (let i = 0; i < target.length; i++) {
			target[i] = buffer[i]
		}

		return
	}

	throw new Error('random: no OS CSPRNG bound on this target')
}

export const random: RandomImpl = {
	get supported() {
		return iosReady() || androidReady()
	},
	fill(view) {
		if (!ArrayBuffer.isView(view)) {
			throw new TypeError('random.fill: expected an ArrayBufferView')
		}

		fillBytes(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
		return view
	},
	bytes(length) {
		if (!Number.isInteger(length) || length < 0) {
			throw new RangeError('random.bytes: length must be a non-negative integer')
		}

		return random.fill(new Uint8Array(length))
	},
}
