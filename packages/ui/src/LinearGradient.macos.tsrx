/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useRef } from 'octane'
import type { LinearGradientProps } from './internal-props'

declare const CAGradientLayer: any
declare const NSColor: any

const GRADIENT_KEY = '__vxGradient'

function nsColor(hex: string): any {
	const h = hex.trim().replace(/^#/, '')
	if (/^[0-9a-fA-F]{6}$/.test(h) || /^[0-9a-fA-F]{8}$/.test(h)) {
		const n = parseInt(h, 16)
		const hasAlpha = h.length === 8
		const r = (n >> (hasAlpha ? 24 : 16)) & 0xff
		const g = (n >> (hasAlpha ? 16 : 8)) & 0xff
		const b = (n >> (hasAlpha ? 8 : 0)) & 0xff
		const a = hasAlpha ? n & 0xff : 255
		return NSColor.colorWithSRGBRedGreenBlueAlpha(r / 255, g / 255, b / 255, a / 255)
	}

	const m = hex.match(/^rgba?\(([^)]+)\)$/)
	if (m) {
		const [r, g, b, a = 1] = m[1].split(',').map((v) => Number(v.trim()))
		return NSColor.colorWithSRGBRedGreenBlueAlpha(r / 255, g / 255, b / 255, a)
	}

	return NSColor.blackColor
}

/** Internal gradient surface — CAGradientLayer sublayer synced to the view
 *  bounds on layout. 'vertical' (top→bottom in the shared convention) runs
 *  from y=1 to y=0: the color-picker macOS probe's rendered pixels confirm
 *  that orientation inside masonview hosts. */
export function LinearGradient(props: LinearGradientProps) @{
	const state = useRef(props)
	state.current = props

	const onLayoutChanged = useCallback((e: any) => {
		const view = e?.object
		if (!view) {
			return
		}

		const { colors, direction } = state.current
		view.wantsLayer = true
		let gradient = view[GRADIENT_KEY] as any
		if (!gradient) {
			gradient = CAGradientLayer.new()
			view[GRADIENT_KEY] = gradient
			view.layer.addSublayer(gradient)
		}

		gradient.colors = colors.map((c: string) => nsColor(c).CGColor)
		gradient.startPoint = direction === 'horizontal' ? { x: 0, y: 0.5 } : { x: 0.5, y: 1 }
		gradient.endPoint = direction === 'horizontal' ? { x: 1, y: 0.5 } : { x: 0.5, y: 0 }
		gradient.frame = view.layer.bounds
	}, [])

	<masonview
		id={props.id}
		className={props.className}
		style={props.style}
		onLayoutChanged={onLayoutChanged}
	/>
}
