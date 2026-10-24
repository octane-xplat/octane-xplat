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
	if (!v) return
	const Orientation = android.graphics.drawable.GradientDrawable.Orientation
	const drawable = new android.graphics.drawable.GradientDrawable(
		direction === 'horizontal' ? Orientation.LEFT_RIGHT : Orientation.TOP_BOTTOM,
		colors.map((c) => new Color(c).android),
	)
	v.setBackground(drawable)
}
