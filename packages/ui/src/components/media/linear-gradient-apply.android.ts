/** Android LinearGradient apply — GradientDrawable on the native view.
 *  The `android` global is touched only inside the function so the module is
 *  import-safe on iOS. */
import { Color } from '@nativescript/core'

declare const android: any

export function applyLinearGradient(
	view: any,
	colors: string[],
	direction: 'horizontal' | 'vertical',
): void {
	const v = view?.android
	if (!v) {
		return
	}
	const Orientation = android.graphics.drawable.GradientDrawable.Orientation
	// GradientDrawable's int[] parameter needs a real Java array — the runtime
	// cannot marshal a JS array of numbers here.
	const ints = (Array as any).create('int', colors.length)
	colors.forEach((c, i) => {
		ints[i] = new Color(c).android
	})
	const drawable = new android.graphics.drawable.GradientDrawable(
		direction === 'horizontal' ? Orientation.LEFT_RIGHT : Orientation.TOP_BOTTOM,
		ints,
	)
	v.setBackground(drawable)
}
