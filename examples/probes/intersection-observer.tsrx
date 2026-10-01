import { Column, ScrollView, Text, View } from '@octane-xplat/ui'
import { IntersectionObserver, supported, useIntersectionObserver } from '@octane-xplat/intersection-observer'
import type { ProbeContext } from '../../scripts/probe/context'

let boundEl: any = null
let hookHits = 0
let lastRatio = -1
const entriesLog: string[] = []

const SPACER = Array.from({ length: 40 }, (_, i) => `spacer row ${i}`)

export default function IntersectionProbe() {
	const { bind, bindRoot, entry, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
		onChange: (e) => {
			hookHits += 1
			lastRatio = e.intersectionRatio
			entriesLog.push(JSON.stringify({ i: e.isIntersecting, r: e.intersectionRatio, br: e.boundingClientRect, ir: e.intersectionRect }))
		},
	})
	return <Column>
		<Text id="probe-visible">{String(isIntersecting)}</Text>
		<Text id="probe-ratio">{String(entry?.intersectionRatio ?? -1)}</Text>
		<ScrollView id="probe-scroll" bind={bindRoot} style={{ height: 200 }}>
			<Column>
				{SPACER.map((label) => <Text key={label}>{label}</Text>)}
				<View id="probe-target" bind={(el: any) => { boundEl = el; bind(el) }} style={{ height: 80, backgroundColor: '#4a6fa5' }} />
				{SPACER.map((label) => <Text key={`after-${label}`}>{label}</Text>)}
			</Column>
		</ScrollView>
	</Column>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('probe-scroll'))
	ctx.record('supported', supported)
	ctx.assert('bind delivered element', !!boundEl, true)
	// Wait for an actual observer entry, not just the hook's null default.
	await ctx.waitFor(() => ctx.inspect('probe-ratio').text !== '-1')
	ctx.assert('initially clipped', ctx.inspect('probe-visible').text, 'false')

	const scroller = ctx.find('probe-scroll')
	if (ctx.target === 'web') {
		scroller.scrollTop = Math.max(0, boundEl.offsetTop - 60)
	} else {
		const targetView = ctx.find('probe-target')
		await ctx.waitFor(() => scroller.scrollableHeight > 0, { timeout: 3000 })
		const targetY = targetView.getLocationOnScreen().y
		const scrollerY = scroller.getLocationOnScreen().y
		const offset = scroller.verticalOffset + targetY - scrollerY - 20
		scroller.scrollToVerticalOffset?.(Math.max(0, Math.min(scroller.scrollableHeight, offset)), false)
	}

	await ctx.waitFor(() => ctx.inspect('probe-visible').text === 'true')
	ctx.assert('visible after scroll', ctx.inspect('probe-visible').text, 'true')
	await ctx.waitFor(() => Number(ctx.inspect('probe-ratio').text) > 0, { timeout: 3000 }).catch(() => {})
	const ratio = Number(ctx.inspect('probe-ratio').text)
	ctx.record('ratio', ratio)
	ctx.record('entries', entriesLog.join(' | '))
	ctx.record('hook-hits', hookHits)
	ctx.record('scroller-frame', JSON.stringify(ctx.inspect('probe-scroll').frame))
	ctx.record('target-frame', JSON.stringify(ctx.inspect('probe-target').frame))
	ctx.assert('mostly visible ratio', ratio > 0.5, true)
}
