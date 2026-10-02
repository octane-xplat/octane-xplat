/** @jsxImportSource @octane-xplat/macos-renderer */
/** Maintained nonvisual AppKit integration case; key monitors are action-dispatched. */
import { CommandPalette, Pressable, Text, VStack } from '@octane-xplat/ui'
import { useSignal$ } from 'octane/signals/client'
import type { ProbeContext } from '../../../scripts/probe/context'

const native = globalThis as any
const monitors: Array<(event: any) => any> = []
let open$: any
let selected = ''
let closes = 0
export default function PaletteProbe() {
	selected = ''
	closes = 0
	open$ = useSignal$(false)
	return <VStack style={{ width: 600, height: 500 }}>
		<Pressable id="open" onPress={() => open$.set(true)}><Text>Open</Text></Pressable>
		<CommandPalette id="palette" label="Commands" open={open$.get()} onOpenChange={(value) => { if (!value) { closes++; } open$.set(value) }} maxHeight={120}
			items={Array.from({ length: 30 }, (_, i) => ({ key: String(i), label: `Command ${i}`, group: i < 15 ? 'First' : 'Second' }))}
			onValueChange={(id) => { selected = id }} />
	</VStack>
}

export async function run(ctx: ProbeContext) {
	const events = native.NSEvent
	const original = events.addLocalMonitorForEventsMatchingMaskHandler
	events.addLocalMonitorForEventsMatchingMaskHandler = (mask: any, handler: any) => {
		monitors.push(handler)
		return original.call(events, mask, handler)
	}

	ctx.onCleanup(() => { events.addLocalMonitorForEventsMatchingMaskHandler = original })
	const parent = (ctx.host as any).window
	const previous = parent.firstResponder
	await ctx.press('open')
	await ctx.waitFor(() => parent.attachedSheet, { timeout: 3000 })
	const sheet = parent.attachedSheet
	const walk = (view: any): any[] => [view, ...Array.from(view.subviews ?? []).flatMap(walk)]
	const views = () => walk(sheet.contentView)
	const field = () => views().find(v => typeof v.currentEditor === 'function')
	await ctx.waitFor(() => monitors.length >= 2, { timeout: 3000 })
	ctx.record('monitorCount', monitors.length)
	await ctx.waitFor(() => field()?.currentEditor(), { timeout: 3000 })
	ctx.assert('real window modal sheet attached', !!parent.attachedSheet, true)
	ctx.assert('field editor focused', sheet.firstResponder === field().currentEditor(), true)
	const key = (code: number) => {
		let event: any = { keyCode: code, window: sheet }
		for (const monitor of monitors) { if (event) { event = monitor(event); } }
		return event
	}

	sheet.contentView.layoutSubtreeIfNeeded()
	const initialScroll = views().find(v => v.documentView && v.contentView?.bounds)
	ctx.assert('PageUp consumed', key(116), null)
	const initialY = Number(initialScroll.contentView.bounds.origin.y)
	ctx.record('initialY', initialY)
	ctx.assert('PageDown consumed by actual adapter', key(121), null)
	ctx.record('afterY', Number(initialScroll.contentView.bounds.origin.y))
	ctx.record('docHeight', Number(initialScroll.documentView.frame.size.height))
	await ctx.waitFor(() => {
		const scroll = views().find(v => v.documentView && v.contentView?.bounds)
		return Number(scroll?.contentView.bounds.origin.y) !== initialY
	}, { timeout: 3000 })

	const scroll = views().find(v => v.documentView && v.contentView?.bounds)
	ctx.record('scrollAfterPageDown', Number(scroll.contentView.bounds.origin.y))
	ctx.assert('keyboard highlight scrolled', Number(scroll.contentView.bounds.origin.y) !== initialY, true)
	ctx.assert('Enter consumed', key(36), null)
	await ctx.waitFor(() => !parent.attachedSheet)
	ctx.assert('last grouped result selected', selected, '29')
	ctx.assert('focus returned', parent.firstResponder === previous, true)
	ctx.assert('selection closes once', closes, 1)
	monitors.length = 0
	await ctx.press('open')
	await ctx.waitFor(() => parent.attachedSheet?.firstResponder)
	const reopened = parent.attachedSheet
	ctx.assert('new sheet on reopen', reopened !== sheet, true)
	const reopenedField = walk(reopened.contentView).find(v => typeof v.currentEditor === 'function')
	await ctx.waitFor(() => reopenedField?.currentEditor() && monitors.length >= 2, { timeout: 3000 })
	reopenedField.stringValue = 'Command 1'
	native.NSNotificationCenter.defaultCenter.postNotificationNameObject('NSControlTextDidChangeNotification', reopenedField)
	await new Promise(resolve => setTimeout(resolve, 100))
	await ctx.waitFor(() => !walk(reopened.contentView).some(v => String(v.stringValue ?? '') === 'Command 29'), { timeout: 3000 })
	ctx.assert('text observer filters results', walk(reopened.contentView).some(v => String(v.stringValue ?? '') === 'Command 29'), false)
	ctx.assert('text observer preserves field value', String(reopenedField.stringValue), 'Command 1')
	let escape: any = { keyCode: 53, window: reopened }
	for (const monitor of monitors) { if (escape) { escape = monitor(escape); } }
	ctx.assert('shared registry consumes Escape', escape, null)
	await ctx.waitFor(() => !parent.attachedSheet)
	ctx.assert('escape dismissed reopened modal', !!parent.attachedSheet, false)
	ctx.assert('Escape closes once', closes, 2)
	monitors.length = 0
	await ctx.press('open')
	await ctx.waitFor(() => parent.attachedSheet)
	open$.set(false)
	await ctx.waitFor(() => !parent.attachedSheet)
	ctx.assert('external close has no dismissal callback', closes, 2)
}
