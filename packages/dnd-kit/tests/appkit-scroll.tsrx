import Demo from '../examples/sortable.macos'
import { measure } from '../src/geometry.macos'
function emitPan(view: any, state: string, deltaY: number) {
	const states: Record<string, number> = { cancelled: 0, began: 1, moved: 2, ended: 3 }
	const debug = (globalThis as any).__xplatMacOSDebug
	debug.panView(view, { state: states[state], deltaX: 0, deltaY })
}

function parent(view: any) { return view.superview }
import type { ProbeContext } from '../../../scripts/probe/context'
export default Demo
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('dnd-task-1') && ctx.find('dnd-scroll'))
	await new Promise(resolve => setTimeout(resolve, 200))
	const scroll = ctx.find('dnd-scroll') as any
	const row = parent(ctx.find('dnd-task-1'))
	const viewport = measure(scroll.contentView)!
	const rect = measure(row)!
	ctx.assert('first row starts inside viewport', rect.top >= viewport.top && rect.bottom <= viewport.bottom, true)
	ctx.record('viewport', viewport.boundingRectangle)
	ctx.record('source', rect.boundingRectangle)
	const dy = viewport.top + viewport.height - 8 - rect.center.y
	emitPan(row, 'began', 0)
	await new Promise(resolve => setTimeout(resolve, 30))
	emitPan(row, 'moved', dy)
	await new Promise(resolve => setTimeout(resolve, 100))
	ctx.assert('translation reaches layer', Number(row.layer.valueForKeyPath('transform.translation.y')) !== 0, true)
	ctx.assert('raised layer while dragging', Number(row.layer.zPosition), 1)
	const before = Number(scroll.contentView.bounds.origin.y)
	await new Promise(resolve => setTimeout(resolve, 200))
	const after = Number(scroll.contentView.bounds.origin.y)
	ctx.assert('auto-scroll moves clip bounds', after !== before, true)
	const translate = Number(row.layer.valueForKeyPath('transform.translation.y'))
	row.window.contentView.layoutSubtreeIfNeeded()
	ctx.assert('translation survives layout', Number(row.layer.valueForKeyPath('transform.translation.y')), translate)
	emitPan(row, 'cancelled', dy)
	await new Promise(resolve => setTimeout(resolve, 60))
	ctx.assert('cancel resets translation', Number(row.layer.valueForKeyPath('transform.translation.y')), 0)
	ctx.assert('cancel resets stacking', Number(row.layer.zPosition), 0)
	const finalOffset = Number(scroll.contentView.bounds.origin.y)
	await new Promise(resolve => setTimeout(resolve, 60))
	ctx.assert('cancel stops auto-scroll', Number(scroll.contentView.bounds.origin.y), finalOffset)
	ctx.record('offsets', {before, after})
}
