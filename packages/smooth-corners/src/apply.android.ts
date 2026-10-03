/** Android smooth-corners apply — custom Drawable paints background +
 *  border along the generated path; a ViewOutlineProvider clips children
 *  (`setPath` API 30+, `setConvexPath` 21–29 for convex curves); `shadow`
 *  maps to `elevation`, which follows the outline. The `android` global is
 *  touched only inside functions so the module is import-safe on iOS. */
import { Color, Utils } from '@nativescript/core'
import { generateCommands } from './path'
import type { PathCommand } from './path'
import type { SmoothCornersProps } from './props'

declare const android: any

const PATH_KEY = '__smoothPath'

function toAndroidPath(cmds: PathCommand[]): any {
	const p = new android.graphics.Path()
	for (const c of cmds) {
		switch (c.c) {
			case 'M':
				p.moveTo(c.x, c.y)
				break
			case 'L':
				p.lineTo(c.x, c.y)
				break
			case 'C':
				p.cubicTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y)
				break
			case 'A': {
				// Canvas is y-down like SVG — degrees map directly.
				const rect = new android.graphics.RectF(c.cx - c.r, c.cy - c.r, c.cx + c.r, c.cy + c.r)
				p.arcTo(rect, c.startDeg, c.sweepDeg, false)
				break
			}
			case 'Z':
				p.close()
				break
		}
	}

	return p
}

function makeDrawable(state: { view: any; props: SmoothCornersProps; path: any }): any {
	return (android.graphics.drawable.Drawable as any).extend({
		draw(canvas: any) {
			const path = state.path
			if (!path) {
				return
			}

			const bg = state.view?.backgroundColor ?? state.view?.style?.backgroundColor
			const border = state.props.border
			if (bg) {
				const paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
				paint.setStyle(android.graphics.Paint.Style.FILL)
				paint.setColor(new Color(bg).android)
				canvas.drawPath(path, paint)
			}

			if (border && border.width > 0 && border.color) {
				const paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
				paint.setStyle(android.graphics.Paint.Style.STROKE)
				// Centered on the edge; the outline clip removes the outer half.
				paint.setStrokeWidth(Utils.layout.toDevicePixels(border.width) * 2)
				paint.setColor(new Color(border.color).android)
				canvas.drawPath(path, paint)
			}
		},
		getOpacity() {
			return android.graphics.PixelFormat.TRANSLUCENT
		},
		setAlpha(_a: number) {},
		setColorFilter(_f: any) {},
	})
}

/** Clip the inner box: outline provider + background/border drawable. */
export function applySmoothClip(view: any, props: SmoothCornersProps): void {
	const s = view?.[PATH_KEY] ?? (view[PATH_KEY] = { view, props, path: null, drawable: null })
	s.props = props
	const v = view?.android as any
	const size = view?.getActualSize?.()
	if (!v || !size || size.width <= 0 || size.height <= 0) {
		return
	}

	s.path = toAndroidPath(
		generateCommands(
			Utils.layout.toDevicePixels(size.width),
			Utils.layout.toDevicePixels(size.height),
			props.corners,
		),
	)

	const path = s.path
	v.setOutlineProvider(
		new ((android.view.ViewOutlineProvider as any).extend({
			getOutline(target: any, outline: any) {
				if (!path) {
					return
				}

				if (android.os.Build.VERSION.SDK_INT >= 30) {
					outline.setPath(path)
				} else {
					// Concave paths throw — degrade to the rect; the drawable
					// still draws the correct background shape.
					try {
						outline.setConvexPath(path)
					} catch {
						outline.setRect(0, 0, target.getWidth(), target.getHeight())
					}
				}
			},
		}))(),
	)

	v.setClipToOutline(true)

	if (!s.drawable) {
		s.drawable = makeDrawable(s)
		v.setBackground(s.drawable)
	}

	s.drawable.setBounds(0, 0, v.getWidth(), v.getHeight())
	v.invalidate()

	// elevation shadows follow the outline — the curve, free.
	if (props.shadow) {
		v.setElevation(Utils.layout.toDevicePixels(props.shadow.blur ?? 8))
	}
}

/** Android needs no separate shadow layer — `elevation` follows the inner
 *  view's outline directly, so the outer hook is a no-op. */
export function applySmoothShadow(_view: any, _props: SmoothCornersProps): void {}
