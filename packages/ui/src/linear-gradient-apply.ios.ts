/** iOS LinearGradient apply — CAGradientLayer inserted at sublayer index 0 so
 *  authored backgrounds/borders still paint. Frame resyncs on loaded and
 *  layoutChanged. Native globals resolve lazily for Android import safety. */
import { Color } from '@nativescript/core'

declare const CAGradientLayer: any

const GRADIENT_KEY = '__vxGradient'

export function applyLinearGradient(
	view: any,
	colors: string[],
	direction: 'horizontal' | 'vertical',
): void {
	const v = view?.ios
	if (!v?.layer) return
	let gradient = v[GRADIENT_KEY] as any
	if (!gradient) {
		gradient = CAGradientLayer.new()
		v[GRADIENT_KEY] = gradient
		v.layer.insertSublayerAtIndex(gradient, 0)
	}
	gradient.colors = colors.map((c) => new Color(c).ios.CGColor)
	if (direction === 'horizontal') {
		gradient.startPoint = { x: 0, y: 0.5 }
		gradient.endPoint = { x: 1, y: 0.5 }
	} else {
		gradient.startPoint = { x: 0.5, y: 0 }
		gradient.endPoint = { x: 0.5, y: 1 }
	}
	gradient.frame = v.layer.bounds
}
