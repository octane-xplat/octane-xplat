import { Column, ScrollView, Text, View } from '@octane-xplat/ui'
import { IntersectionObserver as PlatformIntersectionObserver, supported, useIntersectionObserver } from '@octane-xplat/intersection-observer'
import type { ProbeContext } from '../../scripts/probe/context'

let boundEl: any = null
let hookHits = 0
let lastRatio = -1
const entriesLog: string[] = []
const callbackRatios: number[] = []
const callbackIntersections: boolean[] = []

const SPACER = Array.from({ length: 40 }, (_, i) => `spacer row ${i}`)

export default function IntersectionProbe() {
	const { ref, rootRef, entry, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
		onChange: (e) => {
			hookHits += 1
			lastRatio = e.intersectionRatio
			callbackRatios.push(e.intersectionRatio)
			callbackIntersections.push(e.isIntersecting)
			entriesLog.push(JSON.stringify({ i: e.isIntersecting, r: e.intersectionRatio, br: e.boundingClientRect, ir: e.intersectionRect }))
		},
	})

	return <Column>
		<Text id="probe-visible">{String(isIntersecting)}</Text>
		<Text id="probe-ratio">{String(entry?.intersectionRatio ?? -1)}</Text>
		<ScrollView id="probe-scroll" ref={rootRef} style={{ height: 200 }}>
			<Column>
				{SPACER.map((label) => <Text key={label}>{label}</Text>)}
				<View id="probe-target" ref={(el: any) => { boundEl = el; ref(el) }} style={{ height: 80, backgroundColor: '#4a6fa5' }} />
				{SPACER.map((label) => <Text key={`after-${label}`}>{label}</Text>)}
			</Column>
		</ScrollView>
	</Column>
}

function macOSScrollToTop(scroller: any, requestedTop: number) {
	const clip = scroller.contentView
	const docView = scroller.documentView
	const documentHeight = Number(docView.frame.size.height)
	const viewportHeight = Number(clip.bounds.size.height)
	const maxTop = Math.max(0, documentHeight - viewportHeight)
	const top = Math.max(0, Math.min(maxTop, requestedTop))
	const flippedValue = typeof docView.isFlipped === 'function' ? docView.isFlipped() : docView.isFlipped
	const flipped = flippedValue === true || Number(flippedValue) === 1
	const y = flipped ? top : documentHeight - viewportHeight - top
	clip.scrollToPoint({ x: 0, y })
	scroller.reflectScrolledClipView(clip)
}

async function scrollTargetIntoView(ctx: ProbeContext, scroller: any, target: any) {
	if (ctx.target === 'web') {
		scroller.scrollTop = Math.max(0, target.offsetTop - 60)
		return
	}

	if (ctx.target === 'macos') {
		const docView = scroller.documentView
		const targetRect = target.convertRectToView(target.bounds, docView)
		const flippedValue = typeof docView.isFlipped === 'function' ? docView.isFlipped() : docView.isFlipped
		const flipped = flippedValue === true || Number(flippedValue) === 1
		const targetTop = flipped
			? Number(targetRect.origin.y)
			: Number(docView.frame.size.height) - Number(targetRect.origin.y) - Number(targetRect.size.height)

		macOSScrollToTop(scroller, targetTop - 20)
		return
	}

	await ctx.waitFor(() => scroller.scrollableHeight > 0, { timeout: 3000 })
	const targetY = target.getLocationOnScreen().y
	const scrollerY = scroller.getLocationOnScreen().y
	const offset = scroller.verticalOffset + targetY - scrollerY - 20
	scroller.scrollToVerticalOffset?.(Math.max(0, Math.min(scroller.scrollableHeight, offset)), false)
}

async function scrollTargetPartiallyVisible(ctx: ProbeContext, scroller: any, target: any, visibleHeight: number) {
	if (ctx.target === 'macos') {
		const docView = scroller.documentView
		const targetRect = target.convertRectToView(target.bounds, docView)
		const flippedValue = typeof docView.isFlipped === 'function' ? docView.isFlipped() : docView.isFlipped
		const flipped = flippedValue === true || Number(flippedValue) === 1
		const targetTop = flipped
			? Number(targetRect.origin.y)
			: Number(docView.frame.size.height) - Number(targetRect.origin.y) - Number(targetRect.size.height)

		macOSScrollToTop(scroller, targetTop - Number(scroller.contentView.bounds.size.height) + visibleHeight)
		return
	}

	await ctx.waitFor(() => scroller.scrollableHeight > 0, { timeout: 3000 })
	const targetY = target.getLocationOnScreen().y
	const scrollerY = scroller.getLocationOnScreen().y
	const viewportHeight = scroller.getActualSize().height
	const offset = scroller.verticalOffset + targetY - scrollerY - viewportHeight + visibleHeight
	scroller.scrollToVerticalOffset?.(Math.max(0, Math.min(scroller.scrollableHeight, offset)), false)
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('probe-scroll'))
	ctx.record('supported', supported)
	ctx.assert('observer supported', supported, true)
	ctx.assert('ref delivered element', !!boundEl, true)
	// Wait for an actual observer entry, not just the hook's null default.
	await ctx.waitFor(() => ctx.inspect('probe-ratio').text !== '-1')
	ctx.assert('initially clipped', ctx.inspect('probe-visible').text, 'false')

	const scroller = ctx.find('probe-scroll')
	const target = ctx.find('probe-target')
	if (ctx.target === 'web') {
		await scrollTargetIntoView(ctx, scroller, target)
	} else {
		await scrollTargetPartiallyVisible(ctx, scroller, target, 24)
		await ctx.waitFor(() => ctx.inspect('probe-visible').text === 'true')
		await ctx.waitFor(() => Number(ctx.inspect('probe-ratio').text) > 0 && Number(ctx.inspect('probe-ratio').text) < 0.5)
		ctx.assert('partially visible below threshold', Number(ctx.inspect('probe-ratio').text) < 0.5, true)
		await ctx.waitFor(() => callbackRatios.some((ratio) => ratio > 0 && ratio < 0.5))
		await scrollTargetIntoView(ctx, scroller, target)
	}

	await ctx.waitFor(() => callbackRatios.some((ratio) => ratio >= 0.5))
	const ratio = Number(ctx.inspect('probe-ratio').text)
	ctx.assert('threshold crossed', ratio >= 0.5, true)
	ctx.assert(
		'observer reported threshold sides',
		ctx.target === 'web'
			? callbackRatios.some((value) => value >= 0.5)
			: callbackRatios.some((value) => value > 0 && value < 0.5) && callbackRatios.some((value) => value >= 0.5),
		true,
	)

	ctx.record('threshold ratios', callbackRatios)
	ctx.record('ratio', ratio)

	const manualEntries: number[] = []
	const manualObserver = new PlatformIntersectionObserver(
		(entries) => manualEntries.push(...entries.map((entry) => entry.intersectionRatio)),
		{ root: scroller, threshold: 0.5 },
	)

	manualObserver.observe(target)
	await ctx.waitFor(() => manualEntries.length > 0)
	const afterInitialObserve = manualEntries.length
	manualObserver.unobserve(target)
	const afterUnobserve = manualEntries.length
	if (ctx.target === 'macos') {
		macOSScrollToTop(scroller, 0)
	} else if (ctx.target === 'web') {
		scroller.scrollTop = 0
	} else {
		scroller.scrollToVerticalOffset?.(0, false)
	}

	await ctx.waitFor(() => ctx.inspect('probe-visible').text === 'false')
	ctx.assert('reports leaving viewport', callbackIntersections[callbackIntersections.length - 1], false)
	await scrollTargetIntoView(ctx, scroller, target)
	await ctx.waitFor(() => ctx.inspect('probe-visible').text === 'true')
	await new Promise((resolve) => setTimeout(resolve, 40))
	ctx.assert('unobserve stops callbacks', manualEntries.length, afterUnobserve)
	ctx.record('initial manual entries', afterInitialObserve)

	manualObserver.observe(target)
	await ctx.waitFor(() => manualEntries.length > afterUnobserve)
	manualObserver.disconnect()
	const afterDisconnect = manualEntries.length
	if (ctx.target === 'macos') {
		macOSScrollToTop(scroller, Number(scroller.documentView.frame.size.height))
	} else if (ctx.target === 'web') {
		scroller.scrollTop = scroller.scrollHeight
	} else {
		scroller.scrollToVerticalOffset?.(scroller.scrollableHeight, false)
	}

	await ctx.waitFor(() => ctx.inspect('probe-visible').text === 'false')
	ctx.assert('disconnect continues to report hook exit', callbackIntersections[callbackIntersections.length - 1], false)
	await scrollTargetIntoView(ctx, scroller, target)
	await ctx.waitFor(() => ctx.inspect('probe-visible').text === 'true')
	await new Promise((resolve) => setTimeout(resolve, 40))
	ctx.assert('disconnect stops callbacks', manualEntries.length, afterDisconnect)
	ctx.record('entries', entriesLog.join(' | '))
	ctx.record('hook-hits', hookHits)
	ctx.record('scroller-frame', JSON.stringify(ctx.inspect('probe-scroll').frame))
	ctx.record('target-frame', JSON.stringify(ctx.inspect('probe-target').frame))
}
