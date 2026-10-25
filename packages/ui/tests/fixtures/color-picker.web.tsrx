/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { ColorPicker } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'
let lastChange = ''

export default function ColorProbe() @{
	const [color, setColor] = useState('#ff0000')
	<ColorPicker id="cp" testID="cp" value={color} onChange={(h) => { lastChange = h; setColor(h) }} />
}

export async function run(ctx: ProbeContext) {
	const host: any = await ctx.waitFor(() => document.getElementById('cp'))
	const area = host.querySelector('.vx-color-area')
	const track = host.querySelector('.vx-color-slider-track')
	const sat = host.querySelector('.vx-color-area-sat')
	ctx.record('track-gradient', getComputedStyle(track).backgroundImage)
	ctx.record('sat-gradient', getComputedStyle(sat).backgroundImage)
	ctx.assert('hue track is a linear-gradient', getComputedStyle(track).backgroundImage.includes('linear-gradient'))
	ctx.assert('sat overlay is a linear-gradient', getComputedStyle(sat).backgroundImage.includes('linear-gradient'))

	// Synthetic PointerEvents throw InvalidPointerId on setPointerCapture —
	// stub it on the host so the shared usePan down-handler sets `active`.
	area.setPointerCapture = () => {}
	const rect = area.getBoundingClientRect()
	const opts = (x: number, y: number) => ({ clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: 1 })
	area.dispatchEvent(new PointerEvent('pointerdown', opts(rect.left + 50, rect.top + 50)))
	area.dispatchEvent(new PointerEvent('pointermove', opts(rect.left + 30, rect.top + 50)))
	area.dispatchEvent(new PointerEvent('pointerup', opts(rect.left + 30, rect.top + 50)))
	// dom-dispatch probes cannot drive the shared pointer-capture pan path —
	// record the outcome rather than asserting it; drag is covered by jsdom.
	const deadline = Date.now() + 3000
	while (lastChange === '' && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50))
	ctx.record('drag-change', lastChange || 'no event (dom-dispatch only)')
}
