/** iOS smooth-corners apply — CAShapeLayer mask on the inner view,
 *  layer.shadow* on the outer. Native globals resolve lazily inside these
 *  functions so the module is import-safe on Android bundles. */
import { Color } from '@nativescript/core'
import { generateCommands } from './path'
import type { PathCommand } from './path'
import type { SmoothCornersProps } from './props'

declare const CGPathCreateMutable: any
declare const CGPathMoveToPoint: any
declare const CGPathAddLineToPoint: any
declare const CGPathAddCurveToPoint: any
declare const CGPathAddArc: any
declare const CGPathCloseSubpath: any
declare const CAShapeLayer: any

const rad = (deg: number) => (deg * Math.PI) / 180

function toCGPath(cmds: PathCommand[]): any {
	const p = CGPathCreateMutable()
	for (const c of cmds) {
		switch (c.c) {
			case 'M':
				CGPathMoveToPoint(p, null, c.x, c.y)
				break
			case 'L':
				CGPathAddLineToPoint(p, null, c.x, c.y)
				break
			case 'C':
				CGPathAddCurveToPoint(p, null, c.x1, c.y1, c.x2, c.y2, c.x, c.y)
				break
			case 'A':
				// y-down convention matches CGPath on iOS: positive sweep =
				// increasing angle. Explicit end angle; the flag picks direction.
				CGPathAddArc(
					p,
					null,
					c.cx,
					c.cy,
					c.r,
					rad(c.startDeg),
					rad(c.startDeg + c.sweepDeg),
					c.sweepDeg < 0,
				)
				break
			case 'Z':
				CGPathCloseSubpath(p)
				break
		}
	}

	return p
}

const MASK_KEY = '__smoothMask'
const BORDER_KEY = '__smoothBorder'

function sizeOf(view: any): { w: number; h: number } | null {
	const size = view?.getActualSize?.()
	return size && size.width > 0 && size.height > 0 ? { w: size.width, h: size.height } : null
}

/** Clip the inner box: layer mask + optional border stroke layer. */
export function applySmoothClip(view: any, props: SmoothCornersProps): void {
	const v = view?.ios
	const size = v && sizeOf(view)
	if (!v || !size) {
		return
	}
	const path = toCGPath(generateCommands(size.w, size.h, props.corners))

	let mask = v[MASK_KEY] as any
	if (!mask) {
		mask = CAShapeLayer.new()
		v[MASK_KEY] = mask
	}

	mask.path = path
	v.layer.mask = mask

	let borderLayer = v[BORDER_KEY] as any
	const border = props.border
	if (border && border.width > 0 && border.color) {
		if (!borderLayer) {
			borderLayer = CAShapeLayer.new()
			v[BORDER_KEY] = borderLayer
			v.layer.addSublayer(borderLayer)
		}

		borderLayer.frame = v.layer.bounds
		borderLayer.path = path
		borderLayer.fillColor = null
		borderLayer.strokeColor = new Color(border.color).ios.CGColor
		// Stroke centered on the edge; the mask clips the outer half.
		borderLayer.lineWidth = border.width * 2
	} else if (borderLayer) {
		borderLayer.removeFromSuperlayer()
		v[BORDER_KEY] = null
	}
}

/** Drop shadow on the outer view (a masked layer can't show its own). */
export function applySmoothShadow(view: any, props: SmoothCornersProps): void {
	const layer = view?.ios?.layer
	if (!layer) {
		return
	}
	const shadow = props.shadow
	if (!shadow) {
		layer.shadowPath = null
		layer.shadowOpacity = 0
		return
	}

	const size = sizeOf(view)
	if (!size) {
		return
	}
	// Spread grows the outline — regenerate larger, recenter via the offset.
	const spread = shadow.spread ?? 0
	const w = size.w + spread * 2
	const h = size.h + spread * 2
	layer.shadowPath = toCGPath(generateCommands(w, h, props.corners))
	layer.shadowOffset = {
		width: (shadow.offsetX ?? 0) - spread,
		height: (shadow.offsetY ?? 0) - spread,
	}

	layer.shadowColor = new Color(shadow.color ?? '#000000').ios.CGColor
	layer.shadowOpacity = shadow.opacity ?? 0.35
	layer.shadowRadius = shadow.blur ?? 0
}
