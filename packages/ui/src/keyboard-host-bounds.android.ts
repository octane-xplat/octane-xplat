import { Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

const location = (view: any) => {
	const point = (Array as any).create('int', 2)
	view.getLocationOnScreen(point)
	return { x: point[0], y: point[1] }
}

/** @internal Public View matrices include scale/rotation and ancestor transforms. */
export function measureKeyboardHost(host: any): KeyboardRect | null {
	const native = host?.nativeViewProtected ?? host?.android
	if (!native?.getRootView) {
		return null
	}
	const origin = location(native.getRootView())
	const dip = Utils.layout.toDeviceIndependentPixels
	if (typeof native.transformMatrixToGlobal === 'function') {
		const matrix = new android.graphics.Matrix()
		native.transformMatrixToGlobal(matrix)
		const rect = new android.graphics.RectF(0, 0, native.getWidth(), native.getHeight())
		matrix.mapRect(rect)
		return {
			x: dip(rect.left - origin.x),
			y: dip(rect.top - origin.y),
			width: dip(rect.width()),
			height: dip(rect.height()),
		}
	}
	for (let view = native; view?.getMatrix; view = view.getParent?.()) {
		if (!view.getMatrix().isIdentity()) {
			return null
		}
	}
	const at = location(native)
	return {
		x: dip(at.x - origin.x),
		y: dip(at.y - origin.y),
		width: dip(native.getWidth()),
		height: dip(native.getHeight()),
	}
}
