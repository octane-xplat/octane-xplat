import { createMacOSRoot } from '../../macos-renderer/src/index'
import { motion, MotionConfig } from '../src/index'
import { NSWindow } from '@octane-xplat/platform/macos'
import { View } from '@octane-xplat/ui'

const views: Record<string, any> = {}
function App(props: { wide: boolean; reverse: boolean }) {
	return (
		<MotionConfig reducedMotion="never">
			<View style={{ width: 300, height: 200 }}>
				<motion.View
					layout
					ref={(v: any) => {
						views.parent = v
					}}
					transition={{ duration: 0.4, ease: 'linear' }}
					style={{
						width: props.wide ? 200 : 100,
						height: props.wide ? 200 : 100,
						borderRadius: 20,
						boxShadow: '0px 4px 12px 0px black',
					}}
				>
					{(props.reverse ? ['b', 'a'] : ['a', 'b']).map((id) => (
						<motion.View
							key={id}
							layout="position"
							ref={(v: any) => {
								views[id] = v
							}}
							transition={{ duration: 0.4, ease: 'linear' }}
							style={{ width: 50, height: 30 }}
						/>
					))}
				</motion.View>
			</View>
		</MotionConfig>
	)
}

export async function runLayout() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		NSMakeRect(0, 0, 300, 200),
		0,
		2,
		false,
	)
	window.releasedWhenClosed = false
	const host = window.contentView
	host.wantsLayer = true
	const root = createMacOSRoot(host)
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const flush = async () => {
		for (let i = 0; i < 12; i++) {
			await Promise.resolve()
		}
	}
	const check = (value: boolean, label: string) => {
		if (!value) {
			throw new Error(label)
		}
	}
	const scale = (v: any) => Number(v.layer.valueForKeyPath('transform.scale.x'))
	const visual = (v: any) => v.layer.convertRectToLayer(v.layer.bounds, host.layer)
	try {
		root.render(App, { wide: false, reverse: false })
		await sleep(100)
		check(
			views.parent.bounds.size.width === 100,
			'initial width: ' + views.parent.bounds.size.width,
		)

		const parentBefore = visual(views.parent)
		const childBefore = visual(views.a)
		root.render(App, { wide: true, reverse: false })
		await flush()
		const first = views.parent.bounds.size.width * scale(views.parent)
		check(views.parent.bounds.size.width === 200, 'new layout measured')
		check(
			Math.abs(views.parent.layer.cornerRadius * scale(views.parent) - 20) < 0.5,
			'initial radius correction',
		)

		check(
			Math.abs(views.parent.layer.shadowRadius * scale(views.parent) - 12) < 0.5,
			'initial shadow correction',
		)

		check(Math.abs(first - 100) < 0.5, 'inverse projection before the next frame: ' + first)
		check(
			Math.abs(visual(views.parent).origin.x - parentBefore.origin.x) < 0.5,
			'parent anchor compensation',
		)

		check(
			Math.abs(visual(views.a).origin.x - childBefore.origin.x) < 0.5,
			'nested anchor compensation',
		)

		await sleep(140)
		const mid = views.parent.bounds.size.width * scale(views.parent)
		const child = views.a.bounds.size.width * scale(views.a) * scale(views.parent)
		check(mid > 110 && mid < 190, 'intermediate parent width: ' + mid)
		check(
			Math.abs(views.parent.layer.cornerRadius * scale(views.parent) - 20) < 0.5,
			'intermediate radius correction',
		)

		check(Math.abs(child - 50) < 0.5, 'nested correction: ' + child)
		await sleep(400)
		check(scale(views.parent) === 1, 'restored parent transform')
		check(views.parent.layer.cornerRadius === 20, 'restored authored radius')
		const before = views.a.frame.origin.y
		const beforeVisual = visual(views.a)
		root.render(App, { wide: true, reverse: true })
		await flush()
		check(views.a.frame.origin.y !== before, 'reordered layout')
		check(
			Math.abs(visual(views.a).origin.y - beforeVisual.origin.y) < 0.5,
			'reorder starts at the previous position',
		)

		check(
			Math.abs(Number(views.a.layer.valueForKeyPath('transform.translation.y'))) > 1,
			'reorder inverse transform',
		)

		await sleep(500)
		check(Number(views.a.layer.valueForKeyPath('transform.translation.y')) === 0, 'reorder settles')
		console.log('MOTION_LAYOUT_OK ' + JSON.stringify({ first, mid, child }))
	} finally {
		root.unmount()
		window.close()
	}
}

import { LayoutGroup, Presence } from '../src/index'

const sharedViews: Record<string, any> = {}
function SharedApp(props: { next: boolean; reduced?: boolean }) {
	const card = (id: string, width: number) => (
		<motion.View
			ref={(view: any) => {
				sharedViews[id] = view
			}}
			layoutId="card"
			transition={{ duration: 0.4, ease: 'linear' }}
			style={{ width, height: 80 }}
		/>
	)
	return (
		<MotionConfig reducedMotion={props.reduced ? 'always' : 'never'}>
			<View style={{ width: 400, height: 240 }}>
				<LayoutGroup id="handoff">
					<View style={{ flexDirection: 'row', height: 100 }}>
						<View style={{ width: 140, height: 100 }}>
							<Presence present={!props.next}>{card('old', 100)}</Presence>
						</View>
						<View style={{ width: 200, height: 100 }}>
							<Presence present={props.next}>{card('next', 180)}</Presence>
						</View>
					</View>
				</LayoutGroup>
				<LayoutGroup id="other">{card('isolated', 60)}</LayoutGroup>
			</View>
		</MotionConfig>
	)
}

export async function runSharedLayout() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		NSMakeRect(0, 0, 400, 240),
		0,
		2,
		false,
	)
	window.releasedWhenClosed = false
	const host = window.contentView
	host.wantsLayer = true
	const root = createMacOSRoot(host)
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const flush = async () => {
		for (let i = 0; i < 12; i++) {
			await Promise.resolve()
		}
	}
	const check = (condition: boolean, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}
	const rect = (id: string) =>
		sharedViews[id].layer.convertRectToLayer(sharedViews[id].layer.bounds, host.layer)
	try {
		root.render(SharedApp, { next: false })
		await sleep(100)
		const before = rect('old').origin.x
		root.render(SharedApp, { next: true })
		await flush()
		check(Math.abs(rect('next').origin.x - before) < 0.5, 'shared initial position')
		check(Math.abs(rect('next').size.width - 100) < 0.5, 'shared initial size')
		await sleep(150)
		const mid = rect('next')
		const x = Number(mid.origin.x)
		const width = Number(mid.size.width)
		check(x > before + 10 && x < before + 130, 'shared intermediate position: ' + x)
		check(Math.abs(rect('old').origin.x - x) < 0.5, 'shared follow position')
		check(Math.abs(rect('old').size.width - width) < 0.5, 'shared follow size')
		check(sharedViews.old.alphaValue > 0 && sharedViews.next.alphaValue > 0, 'shared crossfade')
		check(
			Number(sharedViews.isolated.layer.valueForKeyPath('transform.translation.x')) === 0,
			'group isolation',
		)

		root.render(SharedApp, { next: false })
		await flush()
		check(Math.abs(rect('old').origin.x - x) < 0.5, 'shared reversal continuity')
		await sleep(550)
		check(sharedViews.next == null, 'shared exit retention completed')
		check(Math.abs(rect('old').origin.x - before) < 0.5, 'shared reversal settles')
		check(sharedViews.old.alphaValue === 1, 'shared opacity restored')
		root.render(SharedApp, { next: true, reduced: true })
		await flush()
		check(sharedViews.old == null, 'reduced shared exit settles immediately')
		check(Math.abs(rect('next').size.width - 180) < 0.5, 'reduced shared width snaps')
		check(
			Number(sharedViews.next.layer.valueForKeyPath('transform.translation.x')) === 0,
			'reduced shared transform snaps',
		)

		console.log('MOTION_SHARED_LAYOUT_OK ' + JSON.stringify({ x, width }))
	} finally {
		root.unmount()
		window.close()
	}
}

import { ProjectionRoot } from '../src/projection/root'
import { ProjectionNode } from '../src/projection/node'
import { attachProjection } from '../src/projection/adapter'
import { attachHost } from '../src/host'
import { attachDrag } from '../src/drag'
import { Controller } from '../src/controller'
import { barrier } from '../src/projection/barrier'
import { clock } from '../src/clock'
import type { PanCallbacks } from '../src/host-types'
import type { DragInfo } from '../src/types'

const dragViews: Record<string, any> = {}
function DragLayoutApp(props: { shifted: boolean }) {
	return (
		<View style={{ width: 400, height: 200 }}>
			<View
				ref={(view: any) => {
					dragViews.parent = view
				}}
				style={{ marginLeft: props.shifted ? 100 : 0, width: 250, height: 120 }}
			>
				<View
					ref={(view: any) => {
						dragViews.card = view
					}}
					style={{ marginLeft: props.shifted ? 40 : 20, width: 80, height: 60 }}
				/>
			</View>
		</View>
	)
}

/** Real AppKit layout/layers with pan callback dispatch; no OS input claim. */
export async function runDragLayout() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		NSMakeRect(0, 0, 400, 200),
		0,
		2,
		false,
	)
	window.releasedWhenClosed = false
	const host = window.contentView
	host.wantsLayer = true
	const app = createMacOSRoot(host)
	const root = new ProjectionRoot({ clock, barrier })
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const flush = async () => {
		for (let i = 0; i < 12; i++) {
			await Promise.resolve()
		}
	}
	const check = (value: boolean, name: string) => {
		if (!value) {
			throw new Error(name)
		}
	}
	let off: (() => void) | undefined
	let controller: Controller | undefined
	let parent: ProjectionNode | undefined, card: ProjectionNode | undefined
	try {
		app.render(DragLayoutApp, { shifted: false })
		await sleep(100)
		parent = new ProjectionNode()
		parent.options = { animationType: 'both', transition: { duration: 0.4, ease: 'linear' } }
		const parentAdapter = attachProjection(parent, attachHost(dragViews.parent))
		parent.setLatestValues(parentAdapter.read())
		card = new ProjectionNode(parent)
		card.options = { animationType: 'both', transition: { duration: 0.4, ease: 'linear' } }
		let pan!: PanCallbacks
		const adapter = attachProjection(card, {
			...attachHost(dragViews.card),
			pan(_axis, callbacks) {
				pan = callbacks
				return () => {}
			},
		})

		controller = new Controller(clock)
		controller.seed(adapter.read())
		controller.attach(adapter)
		root.add(parent)
		root.add(card)
		root.invalidate('commit')
		const node = card,
			channels = controller

		const props = { drag: 'x' as const, dragMomentum: false }
		off = attachDrag(
			adapter,
			channels,
			props,
			(axis) => channels.value(axis),
			() => false,
			() => props,
			() => node,
		)

		await flush()
		const info = (x: number): DragInfo => ({
			point: { x, y: 0 },
			offset: { x, y: 0 },
			delta: { x, y: 0 },
			velocity: { x: 0, y: 0 },
			cancelled: false,
		})

		const x = () =>
			Number(
				dragViews.card.layer.convertRectToLayer(dragViews.card.layer.bounds, host.layer).origin.x,
			)

		pan.start({}, info(0))
		pan.move({}, info(20))
		await sleep(40)
		const before = x()
		app.render(DragLayoutApp, { shifted: true })
		await flush()
		check(Math.abs(x() - before) < 0.5, 'AppKit drag survives layout commit')
		check(card.currentAnimation === undefined, 'AppKit drag blocks layout animation')
		await sleep(120)
		check(Math.abs(x() - before) < 0.5, 'AppKit drag holds through ancestor animation')
		pan.move({}, info(30))
		await sleep(40)
		check(Math.abs(x() - before - 10) < 0.5, 'AppKit drag origin rebases')
		pan.end({}, info(30))
		await flush()
		check(!card.isAnimationBlocked, 'AppKit release clears layout block')
		check(Math.abs(x() - before - 10) < 0.5, 'AppKit early release continuity')
		await sleep(450)
		check(Math.abs(x() - before - 10) < 0.5, 'AppKit ancestor settlement has no drag drift')
		console.log('MOTION_DRAG_LAYOUT_OK ' + JSON.stringify({ before, after: x() }))
	} finally {
		off?.()
		controller?.destroy()
		if (card) {
			root.remove(card)
		}

		if (parent) {
			root.remove(parent)
		}

		app.unmount()
		window.close()
	}
}

import { ScrollableArea } from '@octane-xplat/ui'
const containerViews: Record<string, any> = {}
let sourceScroller: any
function ContainerApp(props: { moved: boolean; shared: boolean }) {
	const save = (name: string) => (view: any) => {
		if (view) {
			containerViews[name] = view
		}
	}
	return (
		<MotionConfig reducedMotion="never" transition={{ duration: 0.4, ease: 'linear' }}>
			<View style={{ width: 400, height: 300 }}>
				<motion.View
					layoutRoot
					ref={save('root')}
					style={{ marginLeft: props.moved ? 100 : 0, width: 250, height: 100 }}
				>
					<motion.View
						layout="position"
						layoutAnchor={{ x: 1, y: 1 }}
						ref={save('anchor')}
						style={{ marginLeft: props.moved ? 40 : 20, width: 30, height: 30 }}
					/>
				</motion.View>
				<ScrollableArea
					ref={(value: any) => {
						sourceScroller = value
					}}
					style={{ width: 300, height: 100 }}
				>
					<View style={{ width: 280, height: 400 }}>
						{!props.shared && (
							<motion.View
								layoutId="appkit-scroll-source"
								ref={save('source')}
								transition={{ duration: 4, ease: 'linear' }}
								style={{ marginTop: 100, width: 100, height: 50 }}
							/>
						)}
					</View>
				</ScrollableArea>
				{props.shared && (
					<motion.View
						layoutId="appkit-scroll-source"
						ref={save('destination')}
						transition={{ duration: 4, ease: 'linear' }}
						style={{ marginLeft: 140, width: 100, height: 50 }}
					/>
				)}
			</View>
		</MotionConfig>
	)
}

export async function runContainers() {
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		NSMakeRect(0, 0, 400, 300),
		0,
		2,
		false,
	)
	window.releasedWhenClosed = false
	const host = window.contentView
	host.wantsLayer = true
	const root = createMacOSRoot(host)
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const flush = async () => {
		for (let i = 0; i < 12; i++) {
			await Promise.resolve()
		}
	}
	const rect = (name: string) =>
		containerViews[name].layer.convertRectToLayer(containerViews[name].layer.bounds, host.layer)
	const close = (actual: number, expected: number, name: string) => {
		if (!Number.isFinite(actual) || !Number.isFinite(expected) || Math.abs(actual - expected) > 0.5) {
			throw new Error(name + ': ' + actual + ' vs ' + expected)
		}
	}
	try {
		root.render(ContainerApp, { moved: false, shared: false })
		await sleep(100)
		const before = Number(rect('anchor').origin.x)
		root.render(ContainerApp, { moved: true, shared: false })
		await flush()
		close(Number(rect('root').origin.x), 100, 'AppKit root snaps')
		close(
			Number(rect('anchor').origin.x),
			before + 100,
			'AppKit anchor starts relative to snapped root',
		)

		await sleep(500)
		close(Number(rect('anchor').origin.x), before + 120, 'AppKit anchor settles')
		const beforeScroll = Number(rect('source').origin.y)
		sourceScroller.scrollToOffset({ block: 80 }, { animated: false })
		await sleep(50)
		const source = rect('source')
		close(Math.abs(Number(source.origin.y) - beforeScroll), 80, 'AppKit source scrolls')
		root.render(ContainerApp, { moved: true, shared: true })
		await flush()
		const destination = rect('destination')
		close(Number(destination.origin.x), Number(source.origin.x), 'AppKit handoff scroll x')
		close(Number(destination.origin.y), Number(source.origin.y), 'AppKit handoff current scroll y')
		console.log('MOTION_CONTAINERS_OK ' + JSON.stringify({ rootX: Number(rect('root').origin.x), sourceY: Number(source.origin.y), destinationY: Number(destination.origin.y) }))
	} finally {
		root.unmount()
		window.close()
	}
}
