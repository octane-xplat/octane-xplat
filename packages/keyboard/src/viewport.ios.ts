import type { KeyboardViewportLease } from './viewport-types'

/** @internal UIKit's owning-window keyboard guide needs no ancestor padding lease. */
export function leaseKeyboardViewport(_host: object): KeyboardViewportLease {
	return { supported: true, update() {}, release() {} }
}
