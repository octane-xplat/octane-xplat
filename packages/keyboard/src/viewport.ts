import type { KeyboardViewportLease } from './viewport-types'

/** @internal Unsupported software-keyboard targets retain their native viewport. */
export function leaseKeyboardViewport(_host: object): KeyboardViewportLease {
	return { supported: false, update() {}, release() {} }
}
