/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { ColorPicker } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'
declare const CAGradientLayer: any
declare const UIGraphicsImageRenderer: any
declare const UIGraphicsImageRendererFormat: any
declare const CGImageGetWidth: any
declare const CGImageGetHeight: any
declare const CGBitmapContextCreate: any
declare const CGColorSpaceCreateDeviceRGB: any
declare const CGContextDrawImage: any
declare const CGRectMake: any
declare const CGColorGetAlpha: any
declare const NSMutableData: any
declare const interop: any

export default function Fixture() {
	const [color, setColor] = useState('#ff0000')
	return (
		<ColorPicker
			id="cp"
			testID="cp"
			value={color}
			onChange={(h: string) => {
				lastChange = h
				setColor(h)
			}}
		/>
	)
}

function gradientsIn(view: any, out: any[] = []): any[] {
	if (!view?.layer) {
		return out
	}

	const subs = view.layer.sublayers
	if (subs) {
		const count = Number(subs.count ?? subs.length ?? 0)
		for (let i = 0; i < count; i++) {
			const l = subs.objectAtIndex ? subs.objectAtIndex(i) : subs[i]
			if (
				l &&
				(l instanceof CAGradientLayer ||
					l === view.__vxGradient ||
					l.class?.() === 'CAGradientLayer')
			) {
				out.push({ view, layer: l })
			}
		}
	}

	const kids = view.subviews
	const n = kids ? Number(kids.count ?? kids.length ?? 0) : 0
	for (let i = 0; i < n; i++) {
		gradientsIn(kids.objectAtIndex ? kids.objectAtIndex(i) : kids[i], out)
	}

	return out
}

export async function run(ctx: ProbeContext) {
	const found: any = await ctx.waitFor(() => ctx.find('cp'))
	const root = found?.ios ?? found?.native ?? found
	const grads = await ctx.waitFor(() => {
		const g = gradientsIn(root)
		const seven = g.find((e) => Number(e.layer.colors?.count ?? e.layer.colors?.length ?? 0) === 7)
		return g.length >= 3 && Number(seven?.layer?.frame?.size?.width ?? 0) > 0 ? g : null
	})

	ctx.record('gradient-count', grads.length)

	const seven = grads.find(
		(g) => Number(g.layer.colors?.count ?? g.layer.colors?.length ?? 0) === 7,
	)

	ctx.assert('hue track: CAGradientLayer with 7 colors', !!seven, true)
	const f = seven.layer.frame,
		b = seven.view.layer.bounds

	ctx.record('hue frame', { w: Number(f.size.width), h: Number(f.size.height) })
	ctx.record('hue bounds', { w: Number(b.size.width), h: Number(b.size.height) })
	ctx.assert(
		'hue frame == bounds, non-zero',
		Math.abs(f.size.width - b.size.width) < 0.01 &&
			Math.abs(f.size.height - b.size.height) < 0.01 &&
			f.size.width > 0,
		true,
	)

	// Vertical overlay (2 colors, transparent→black). On iOS the gradient's
	// unit space is top-origin: startPoint y=0 is the transparent top stop.
	const vert = grads.find(
		(g) =>
			Number(g.layer.colors?.count ?? g.layer.colors?.length ?? 0) === 2 &&
			Number(g.layer.startPoint?.x ?? -1) === 0.5,
	)

	ctx.assert('vertical overlay found', !!vert, true)
	ctx.record('startPoint', {
		x: Number(vert.layer.startPoint?.x),
		y: Number(vert.layer.startPoint?.y),
	})

	// Pixel check through UIKit's own snapshot path: the area's top edge is
	// bright (brightness 1), its bottom edge black (brightness 0), and its
	// top-left white (saturation 0). The bitmap context fixes RGBA order; a
	// drawViewHierarchy CGImage already lands memory-row-0 = image top in a
	// plain context — no CTM flip.
	const area = vert.view.superview
	const size = area.bounds.size
	const format = UIGraphicsImageRendererFormat.defaultFormat()
	format.scale = 1
	format.opaque = true
	const renderer = UIGraphicsImageRenderer.alloc().initWithSizeFormat(size, format)
	const image = renderer.imageWithActions(() => {
		area.drawViewHierarchyInRectAfterScreenUpdates(area.bounds, true)
	})

	const cg = image.CGImage
	const W = Number(CGImageGetWidth(cg)),
		H = Number(CGImageGetHeight(cg))

	const bytesPerRow = W * 4
	const buf = NSMutableData.alloc().initWithLength(bytesPerRow * H)
	const bitmap = CGBitmapContextCreate(
		buf.mutableBytes,
		W,
		H,
		8,
		bytesPerRow,
		CGColorSpaceCreateDeviceRGB(),
		1 /* kCGImageAlphaPremultipliedLast */,
	)

	CGContextDrawImage(bitmap, CGRectMake(0, 0, W, H), cg)
	const bytes = new Uint8Array(interop.bufferFromData(buf))
	const sample = (x: number, y: number) => {
		const o = Math.round(y) * bytesPerRow + Math.round(x) * 4
		return { r: bytes[o], g: bytes[o + 1], b: bytes[o + 2] }
	}

	const topLeft = sample(2, 2),
		topRight = sample(W - 3, 2),
		bottom = sample(W / 2, H - 3)

	ctx.record('pixels', { W, H, topLeft, topRight, bottom })
	ctx.assert('area top-left is white', topLeft.r > 230 && topLeft.g > 230 && topLeft.b > 230, true)
	ctx.assert(
		'area top-right is the hue (red)',
		topRight.r > 200 && topRight.g < 60 && topRight.b < 60,
		true,
	)

	ctx.assert('area bottom is black', bottom.r < 25 && bottom.g < 25 && bottom.b < 25, true)

	const topColor = vert.layer.colors.objectAtIndex
		? vert.layer.colors.objectAtIndex(0)
		: vert.layer.colors[0]

	const alpha = Number(CGColorGetAlpha(topColor))
	ctx.record('top stop alpha', alpha)
	ctx.assert('top stop alpha == 0', alpha, 0)
}
