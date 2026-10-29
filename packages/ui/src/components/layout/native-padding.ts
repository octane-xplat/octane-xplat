import { leaseKeyboardProperty } from '@octane-xplat/platform/keyboard-property'
import type { KeyboardPropertyLease } from '@octane-xplat/platform/keyboard-property'

/** @internal Mason reads padding back as `{ value, unit }` in float32; tolerate our own rounded write. */
export function leaseNativePaddingBottom(view: any): KeyboardPropertyLease {
	let lastWrite: number | undefined
	return leaseKeyboardProperty(
		() => {
			const raw = view.style?.paddingBottom
			let value: number
			if (typeof raw === 'number') {
				value = raw
			} else if (raw && (raw.unit === 'px' || raw.unit === 'dip')) {
				value = Number(raw.value)
			} else {
				value = Number(raw) || 0
			}
			if (lastWrite !== undefined && Math.abs(value - lastWrite) < 0.01) {
				return lastWrite
			}
			return value
		},
		(value) => {
			view.style ??= {}
			view.style.paddingBottom = value
			lastWrite = value
		},
	)
}
