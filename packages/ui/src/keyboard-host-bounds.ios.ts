import { isKeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

/** @internal UIKit converts the complete transformed bounds into its window. */
export function measureKeyboardHost(host: any): KeyboardRect | null {
	const native = host?.nativeViewProtected ?? host?.ios
	if (!native?.window || !native.bounds) {
		return null
	}
	const value = native.convertRectToView(native.bounds, native.window)
	const rect = {
		x: value.origin.x,
		y: value.origin.y,
		width: value.size.width,
		height: value.size.height,
	}
	return isKeyboardRect(rect) ? rect : null
}
