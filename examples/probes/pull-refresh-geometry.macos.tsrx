/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import {
	NSApplication, NSEventType, NSNotificationCenter, NSScrollElasticity,
	NSScrollViewWillStartLiveScrollNotification, NSScrollViewDidLiveScrollNotification,
	NSScrollViewDidEndLiveScrollNotification,
} from '@octane-xplat/platform/macos'
import type { ProbeContext } from '../../scripts/probe/context'

type Controls = { sample: (kind: string) => void; inset: () => void; elasticity: () => void; clear: () => void }
const finite = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null
const rect = (value: CGRect) => ({ x: finite(value.origin.x), y: finite(value.origin.y), width: finite(value.size.width), height: finite(value.size.height) })
function warning(message: string) { try { console.warn(message) } catch {} }

/** Idle diagnostic only. No scripted input, refresh action or qualification. */
function GeometryReader() {
	const scroller = useRef<NSScrollView | null>(null)
	const controls = useRef<Controls | null>(null)
	const rows = useRef<Record<string, unknown>[]>([])
	const [tall, setTall] = useState(true), [reserved, setReserved] = useState(false)
	useEffect(() => {
		const view = scroller.current
		if (!view) return
		let active = true, sequence = 0, inset = false, elastic = false
		const tokens: NSObject[] = [], restore: (() => void)[] = []
		let center: NSNotificationCenter | undefined
		let remove: NSNotificationCenter['removeObserver'] | undefined
		const lease: Controls = { sample, inset: () => {}, elasticity: () => {}, clear: () => { if (active) { rows.current = []; sample('clear') } } }
		function sample(kind: string) {
			if (!active || rows.current.length >= 256) return
			try {
				const clip = view!.contentView, document = view!.documentView
				const event = NSApplication.sharedApplication.currentEvent
				const wheel = event?.type === NSEventType.ScrollWheel ? event : null
				const flipped = document.flipped
				const height = Number(document.frame.size.height), viewport = Number(clip.bounds.size.height)
				const origin = Number(clip.bounds.origin.y), max = Math.max(0, height - viewport)
				const logicalTop = typeof flipped === 'boolean' && [height, viewport, origin].every(Number.isFinite)
					? (flipped ? origin : max - origin) : null
				const entry = { sequence: ++sequence, kind, frame: rect(view!.frame), clip: rect(clip.bounds),
					document: rect(document.frame), flipped: typeof flipped === 'boolean' ? flipped : null,
					flippedType: typeof flipped, logicalTop, phase: finite(wheel?.phase), momentum: finite(wheel?.momentumPhase),
					deltaY: finite(wheel?.scrollingDeltaY), insetTop: finite(view!.contentInsets.top) }
				if (!active) return
				rows.current.push(entry)
				console.log('[pull-refresh-geometry]', JSON.stringify(entry))
			} catch { if (active) warning('[pull-refresh-geometry] Snapshot unavailable') }
		}
		const stop = () => {
			if (!active) return
			active = false
			if (controls.current === lease) controls.current = null
			for (const token of tokens.splice(0)) {
				try { remove!.call(center, token) } catch { warning('[pull-refresh-geometry] Observer cleanup failed') }
			}
			for (const reset of restore.splice(0)) {
				try { reset() } catch { warning('[pull-refresh-geometry] Local view reset failed') }
			}
		}
		try {
			center = NSNotificationCenter.defaultCenter
			remove = center.removeObserver
			const add = center.addObserverForNameObjectQueueUsingBlock
			if (typeof add !== 'function' || typeof remove !== 'function') throw Error('observation unavailable')
			const insets = view.contentInsets
			const originalInsets = { top: insets.top, left: insets.left, bottom: insets.bottom, right: insets.right }
			if (!Object.values(originalInsets).every(Number.isFinite)) throw Error('invalid insets')
			const originalAuto = view.automaticallyAdjustsContentInsets
			const originalElasticity = view.verticalScrollElasticity
			restore.push(() => { view.contentInsets = originalInsets },
				() => { view.automaticallyAdjustsContentInsets = originalAuto },
				() => { view.verticalScrollElasticity = originalElasticity })
			lease.inset = () => {
				if (!active) return
				try {
					inset = !inset
					view.automaticallyAdjustsContentInsets = false
					view.contentInsets = { ...originalInsets, top: originalInsets.top + (inset ? 64 : 0) }
					view.tile()
					sample('inset-trial')
					queueMicrotask(() => sample('inset-trial-microtask'))
				} catch { warning('[pull-refresh-geometry] Local inset trial unavailable') }
			}
			lease.elasticity = () => {
				if (!active) return
				try {
					elastic = !elastic
					view.verticalScrollElasticity = elastic ? NSScrollElasticity.Allowed : originalElasticity
					sample('elasticity-trial')
				} catch { warning('[pull-refresh-geometry] Local elasticity trial unavailable') }
			}
			for (const [name, kind] of [
				[NSScrollViewWillStartLiveScrollNotification, 'start'],
				[NSScrollViewDidLiveScrollNotification, 'live'],
				[NSScrollViewDidEndLiveScrollNotification, 'end'],
			]) {
				const token = add.call(center, name, view, null, () => {
					if (!active || rows.current.length >= 256) return
					sample(kind)
					if (active) queueMicrotask(() => sample(kind + '-microtask'))
				})
				if (token == null) throw Error('observer unavailable')
				if (!active) { remove.call(center, token); return stop }
				tokens.push(token)
			}
			controls.current = lease
			sample('ready')
		} catch { stop(); warning('[pull-refresh-geometry] Setup unavailable') }
		return stop
	}, [])
	return <VStack gap={2}>
		<masonview style={{ width: 320, height: 240, display: 'flex', flexDirection: 'column' }}>
			<masonview style={{ height: reserved ? 64 : 0, flexShrink: 0, overflow: 'hidden' }}>
				<label text="Reserved header trial: 64 points" />
			</masonview>
			<scrollview id="pull-refresh-geometry" ref={scroller} orientation="vertical"
				style={{ flexGrow: 1, flexShrink: 1, height: 0, minHeight: 0 }}
				onScroll={() => controls.current?.sample('bounds')}
				onLayoutChanged={() => controls.current?.sample('layout')}>
				<masonview style={{ width: 320, height: tall ? 900 : 80 }}>
					<label text={tall ? 'Long artificial content: 900 points' : 'Short artificial content: 80 points'} />
				</masonview>
			</scrollview>
		</masonview>
		<Button label="Record snapshot" clickAction={() => controls.current?.sample('manual')} />
		<Button label="Toggle short/long content" clickAction={() => setTall(!tall)} />
		<Button label="Toggle reserved header" clickAction={() => setReserved(!reserved)} />
		<Button label="Toggle local top inset trial" clickAction={() => controls.current?.inset()} />
		<Button label="Toggle allowed elasticity" clickAction={() => controls.current?.elasticity()} />
		<Button label="Clear trace (maximum 256 rows)" clickAction={() => controls.current?.clear()} />
	</VStack>
}
export default function PullRefreshGeometryProbe() {
	const [mounted, setMounted] = useState(true)
	return <VStack gap={2}>
		<Text>Idle AppKit diagnostic. After native verification is authorized, manually pull past the top, retreat and release, then compare short/long content, inset and reserved-header trials. Logs contain numeric geometry and available current-event phases only. Current-event values may be absent or unrelated to a notification. No pull-refresh behavior is implemented or proved.</Text>
		<Button label={mounted ? 'Unmount reader' : 'Mount reader'} clickAction={() => setMounted(!mounted)} />
		{mounted ? <GeometryReader /> : null}
		<Text id="pull-refresh-geometry-status">{mounted ? 'Reader mounted; phase/docking qualification pending' : 'Reader unmounted'}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('pull-refresh-geometry-status'))
	ctx.record('qualification', 'Mounted diagnostic only. No OS gesture, native phase, docking, cleanup, memory or pull-refresh qualification performed.')
}
