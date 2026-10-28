import { Color } from '@nativescript/core'
import { Microsoft } from '@octane-xplat/platform/windows'

/** Paint a WinUI background brush without loading mobile gradient backends. */
export function applyLinearGradient(
	view: any,
	colors: string[],
	direction: 'horizontal' | 'vertical',
): void {
	const native = view?.nativeViewProtected
	if (!native) {
		return
	}

	const media = Microsoft.UI.Xaml.Media
	const brush = new media.LinearGradientBrush()
	brush.StartPoint = direction === 'horizontal' ? { X: 0, Y: 0.5 } : { X: 0.5, Y: 0 }
	brush.EndPoint = direction === 'horizontal' ? { X: 1, Y: 0.5 } : { X: 0.5, Y: 1 }
	colors.forEach((value, index) => {
		const color = new Color(value)
		const stop = new media.GradientStop()
		// Match the pinned core: the bridge accepts a plain ARGB color struct.
		stop.Color = {
			A: Math.round(color.a),
			R: Math.round(color.r),
			G: Math.round(color.g),
			B: Math.round(color.b),
		}
		stop.Offset = colors.length > 1 ? index / (colors.length - 1) : 0
		brush.GradientStops.Append(stop)
	})
	native.Background = brush
}
