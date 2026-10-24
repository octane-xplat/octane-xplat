/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import { ColorPicker } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'
declare const CAGradientLayer: any
declare const NSColor: any
declare const NSColorSpace: any

export default function Fixture() {
	const [color, setColor] = useState('#ff0000')
	return <ColorPicker id="cp" testID="cp" value={color} onChange={(h: string) => { lastChange = h; setColor(h) }} />
}

function gradientsIn(view: any, out: any[] = []): any[] {
	if (!view?.layer) return out
	const subs = view.layer.sublayers
	if (subs) {
		const count = Number(subs.count ?? subs.length ?? 0)
		for (let i = 0; i < count; i++) {
			const l = subs.objectAtIndex ? subs.objectAtIndex(i) : subs[i]
			if (l && (l instanceof CAGradientLayer || l.class?.() === 'CAGradientLayer' || Array.isArray(l.colors) || l.colors?.count > 0)) out.push({ view, layer: l })
		}
	}
	const kids = view.subviews
	const n = kids ? Number(kids.count ?? kids.length ?? 0) : 0
	for (let i = 0; i < n; i++) gradientsIn(kids.objectAtIndex ? kids.objectAtIndex(i) : kids[i], out)
	return out
}

export async function run(ctx: ProbeContext) {
	const found: any = await ctx.waitFor(() => ctx.find('cp'))
	const root = found?.native ?? found
	const grads = await ctx.waitFor(() => {
		const g = gradientsIn(root)
		return g.length >= 3 ? g : null
	})
	ctx.record('gradient-count', grads.length)

	const seven = grads.find((g) => (Number(g.layer.colors?.count ?? g.layer.colors?.length ?? 0)) === 7)
	ctx.assert('hue track: CAGradientLayer with 7 colors', !!seven, true)
	const f = seven.layer.frame, b = seven.view.layer.bounds
	ctx.record('hue frame', { w: Number(f.size.width), h: Number(f.size.height) })
	ctx.record('hue bounds', { w: Number(b.size.width), h: Number(b.size.height) })
	ctx.assert('hue frame == bounds, non-zero', Math.abs(f.size.width - b.size.width) < 0.01 && Math.abs(f.size.height - b.size.height) < 0.01 && f.size.width > 0, true)

	// Vertical overlay (2 colors, transparent→black). Its visual direction is
	// asserted from rendered pixels below — layer flip flags alone don't say
	// which way the sublayer's unit space renders.
	const vert = grads.find((g) => Number(g.layer.colors?.count ?? g.layer.colors?.length ?? 0) === 2 &&
		Number(g.layer.startPoint?.x ?? -1) === 0.5)
	ctx.assert('vertical overlay found', !!vert, true)
	const flipped = !!(vert.view.isFlipped ?? vert.view.flipped)
	const geoFlipped = !!vert.layer.isGeometryFlipped
	const startY = Number(vert.layer.startPoint?.y)
	ctx.record('flipped', { flipped, geoFlipped, startY })

	// Pixel check through AppKit's own display cache (bitmap rows are
	// top-down): the area's top edge is bright (brightness 1), its bottom
	// edge black (brightness 0), and its top-left white (saturation 0).
	const area = vert.view.superview
	const kids: any[] = []
	for (let i = 0; i < Number(area.subviews.count); i++) {
		const k = area.subviews.objectAtIndex(i), fr = k.frame
		kids.push({ x: Number(fr.origin.x), y: Number(fr.origin.y), w: Number(fr.size.width), h: Number(fr.size.height), grad: !!k.__vxGradient })
	}
	ctx.record('area children', kids)
	const rect = area.bounds
	const rep = area.bitmapImageRepForCachingDisplayInRect(rect)
	area.cacheDisplayInRectToBitmapImageRep(rect, rep)
	const W = Number(rep.pixelsWide), H = Number(rep.pixelsHigh)
	const sample = (x: number, y: number) => {
		const c = rep.colorAtXY(Math.round(x), Math.round(y)).colorUsingColorSpace(NSColorSpace.sRGBColorSpace)
		return { r: Math.round(c.redComponent * 255), g: Math.round(c.greenComponent * 255), b: Math.round(c.blueComponent * 255) }
	}
	const topLeft = sample(2, 2), topRight = sample(W - 3, 2), bottom = sample(W / 2, H - 3)
	ctx.record('pixels', { W, H, topLeft, topRight, bottom })
	ctx.assert('area top-left is white', topLeft.r > 230 && topLeft.g > 230 && topLeft.b > 230, true)
	ctx.assert('area top-right is the hue (red)', topRight.r > 200 && topRight.g < 60 && topRight.b < 60, true)
	ctx.assert('area bottom is black', bottom.r < 25 && bottom.g < 25 && bottom.b < 25, true)

	const topColor = vert.layer.colors.objectAtIndex ? vert.layer.colors.objectAtIndex(0) : vert.layer.colors[0]
	const alpha = NSColor.colorWithCGColor(topColor).alphaComponent
	ctx.record('top stop alpha', Number(alpha))
	ctx.assert('top stop alpha == 0', Number(alpha), 0)
}
