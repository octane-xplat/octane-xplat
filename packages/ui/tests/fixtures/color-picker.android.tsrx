/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { ColorPicker } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'
declare const android: any

export default function Fixture() {
	const [color, setColor] = useState('#ff0000')
	return <ColorPicker id="cp" testID="cp" value={color} onChange={(h: string) => { lastChange = h; setColor(h) }} />
}

function gradientsIn(view: any, out: any[] = []): any[] {
	if (!view) return out
	const bg = view.getBackground?.()
	if (bg && String(bg.getClass?.().getName?.() ?? '') === 'android.graphics.drawable.GradientDrawable' && bg.getColors?.()) {
		out.push({ view, layer: bg })
	}
	const n = Number(view.getChildCount?.() ?? 0)
	for (let i = 0; i < n; i++) gradientsIn(view.getChildAt(i), out)
	return out
}

function channels(px: number) {
	const u = px >>> 0
	return { a: (u >>> 24) & 0xff, r: (u >>> 16) & 0xff, g: (u >>> 8) & 0xff, b: u & 0xff }
}

export async function run(ctx: ProbeContext) {
	const found: any = await ctx.waitFor(() => ctx.find('cp'))
	const root = found?.android ?? found?.native ?? found
	const Orientation = android.graphics.drawable.GradientDrawable.Orientation
	const grads = await ctx.waitFor(() => {
		const g = gradientsIn(root)
		const seven = g.find((e) => (e.layer.getColors()?.length ?? 0) === 7)
		return g.length >= 3 && Number(seven?.view?.getWidth?.() ?? 0) > 0 ? g : null
	})
	ctx.record('gradient-count', grads.length)

	const seven = grads.find((g) => (g.layer.getColors()?.length ?? 0) === 7)
	ctx.assert('hue track: GradientDrawable with 7 colors', !!seven, true)
	ctx.record('hue view', { w: Number(seven.view.getWidth()), h: Number(seven.view.getHeight()) })
	ctx.assert('hue view non-zero', Number(seven.view.getWidth()) > 0 && Number(seven.view.getHeight()) > 0, true)
	ctx.assert('hue is LEFT_RIGHT', String(seven.layer.getOrientation()) === String(Orientation.LEFT_RIGHT), true)

	// Vertical overlay (2 colors, transparent→black, TOP_BOTTOM orientation).
	const vert = grads.find((g) => (g.layer.getColors()?.length ?? 0) === 2 &&
		String(g.layer.getOrientation()) === String(Orientation.TOP_BOTTOM))
	ctx.assert('vertical overlay found', !!vert, true)

	// Pixel check through View.draw into an ARGB_8888 bitmap: the area's top
	// edge is bright (brightness 1), its bottom edge black (brightness 0),
	// and its top-left white (saturation 0).
	const area = vert.view.getParent()
	const W = Number(area.getWidth()), H = Number(area.getHeight())
	const bitmap = android.graphics.Bitmap.createBitmap(W, H, android.graphics.Bitmap.Config.ARGB_8888)
	const canvas = new android.graphics.Canvas(bitmap)
	area.draw(canvas)
	const sample = (x: number, y: number) => channels(bitmap.getPixel(Math.round(x), Math.round(y)))
	const topLeft = sample(2, 2), topRight = sample(W - 3, 2), bottom = sample(W / 2, H - 3)
	ctx.record('pixels', { W, H, topLeft, topRight, bottom })
	ctx.assert('area top-left is white', topLeft.r > 230 && topLeft.g > 230 && topLeft.b > 230, true)
	ctx.assert('area top-right is the hue (red)', topRight.r > 200 && topRight.g < 60 && topRight.b < 60, true)
	ctx.assert('area bottom is black', bottom.r < 25 && bottom.g < 25 && bottom.b < 25, true)

	const topAlpha = channels(Number(vert.layer.getColors()[0])).a
	ctx.record('top stop alpha', topAlpha)
	ctx.assert('top stop alpha == 0', topAlpha, 0)
}
