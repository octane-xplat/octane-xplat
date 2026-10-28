/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import { ScrollableArea, useScrollableArea, View, Text } from '@octane-xplat/ui'
import type { ScrollAxis, UseScrollableAreaResult } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'

let area: UseScrollableAreaResult
let viewport: any
let changeAxis: (axis: ScrollAxis) => void
let changeSize: (size: number[]) => void
let resizeViewport: (size: number[]) => void
let resizeContent: (size: number[]) => void
const capture = (handle: any) => {
	viewport = handle?.native ?? null
}

export default function Fixture() {
	const [axis, setAxis] = useState<ScrollAxis>('both')
	const [size, setSize] = useState([640, 480])
	changeAxis = setAxis
	changeSize = setSize
	return (
		<View>
			<ScrollableArea
				id="scroll-contract"
				axis={axis}
				ref={capture}
				width={320}
				height={240}
				label="Scroll geometry"
			>
				<View style={{ width: size[0], height: size[1] }}>
					<Text>Geometry content</Text>
				</View>
			</ScrollableArea>
		</View>
	)
}

function metrics() {
	const clip = viewport.contentView.bounds
	const doc = viewport.documentView.frame
	return {
		width: Number(clip.size.width),
		height: Number(clip.size.height),
		contentWidth: Number(doc.size.width),
		contentHeight: Number(doc.size.height),
		x: Number(clip.origin.x),
		y: Number(clip.origin.y),
	}
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(
		() => viewport && metrics().width > 0 && metrics().contentWidth > metrics().width,
		{ timeout: 5000 },
	)

	const original = viewport
	ctx.assert('both inline overflow', metrics().contentWidth > metrics().width, true)
	ctx.assert('both block overflow', metrics().contentHeight > metrics().height, true)
	ctx.record('both geometry', metrics())
	viewport.contentView.scrollToPoint({ x: 80, y: 80 })
	viewport.reflectScrolledClipView(viewport.contentView)
	ctx.assert('inline movement', metrics().x > 0, true)
	ctx.assert('block movement', metrics().y > 0, true)
	changeAxis('inline')
	await ctx.waitFor(() => viewport.hasVerticalScroller === false)
	ctx.assert('inline ref stable', viewport === original, true)
	ctx.assert('inline block fits', Math.abs(metrics().height - metrics().contentHeight) < 1, true)
	ctx.record('inline geometry', metrics())
	changeSize([640, 100])
	changeAxis('block')
	await ctx.waitFor(
		() =>
			viewport.hasHorizontalScroller === false &&
			Math.abs(metrics().width - metrics().contentWidth) < 1,
	)

	ctx.assert('block ref stable', viewport === original, true)
	ctx.assert('block inline fits', Math.abs(metrics().width - metrics().contentWidth) < 1, true)
	ctx.record('block geometry', metrics())

	const headless = { current: null as any }
	let calls = 0
	let callbackState: any
	let scrollEvent: any
	await ctx.mount(Headless, {
		ref: headless,
		onScroll: (event: any) => {
			calls++
			callbackState = area.state
			scrollEvent = event
		},
	})

	ctx.assert('component ref cleared on removal', viewport == null, true)
	await ctx.waitFor(() => area.state.inline.isScrollable && area.state.block.isScrollable)
	ctx.assert('headless initial inline edge', area.state.inline.atStart, true)
	ctx.assert('headless initial block edge', area.state.block.atStart, true)
	const before = calls
	const clip = headless.current.contentView
	clip.scrollToPoint({ x: 80, y: 80 })
	headless.current.reflectScrolledClipView(clip)
	await ctx.waitFor(() => calls > before)
	ctx.assert('native callback once', calls - before, 1)
	ctx.assert('callback sees updated inline state', callbackState.inline.atStart, false)
	ctx.assert('callback sees updated block state', callbackState.block.atStart, false)
	ctx.assert(
		'original event fields',
		Object.keys(scrollEvent).join(','),
		'verticalOffset,viewportHeight,contentHeight',
	)

	ctx.record('headless state after native scroll', area.state)
	resizeContent([100, 100])
	await ctx.waitFor(() => !area.state.inline.isScrollable && !area.state.block.isScrollable)
	ctx.assert(
		'fitting content inline edges',
		area.state.inline.atStart && area.state.inline.atEnd,
		true,
	)

	ctx.assert(
		'fitting content block edges',
		area.state.block.atStart && area.state.block.atEnd,
		true,
	)

	resizeContent([350, 260])
	await ctx.waitFor(() => area.state.inline.isScrollable && area.state.block.isScrollable)
	ctx.assert(
		'content growth updates overflow',
		area.state.inline.isScrollable && area.state.block.isScrollable,
		true,
	)

	resizeViewport([450, 300])
	await ctx.waitFor(() => !area.state.inline.isScrollable && !area.state.block.isScrollable)
	ctx.assert(
		'viewport resize updates overflow',
		area.state.inline.isScrollable || area.state.block.isScrollable,
		false,
	)

	await ctx.mount(Removed, {})
	ctx.assert('headless object ref cleared on removal', headless.current == null, true)
}

function Headless(props: { ref: any; onScroll: (event: any) => void }) {
	const [viewportSize, setViewportSize] = useState([320, 240])
	const [contentSize, setContentSize] = useState([640, 480])
	resizeViewport = setViewportSize
	resizeContent = setContentSize
	area = useScrollableArea({ axis: 'both' })
	return (
		<masonview style={{ display: 'flex' }}>
			<scrollview
				{...area.getViewportProps({
					ref: props.ref,
					onScroll: props.onScroll,
					style: { width: viewportSize[0], height: viewportSize[1] },
				})}
			>
				<masonview
					{...area.getContentProps({ style: { width: contentSize[0], height: contentSize[1] } })}
					style={{ display: 'flex' }}
				>
					<label text="Headless content" />
				</masonview>
			</scrollview>
		</masonview>
	)
}

function Removed() {
	return <label text="Removed" />
}
