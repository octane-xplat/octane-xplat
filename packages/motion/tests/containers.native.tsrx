import { parseCSSShadow } from '@nativescript/core/ui/styling/css-shadow'
import { useState } from 'octane'
import { View, ScrollableArea } from '@octane-xplat/ui'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'
import type { View as NativeView } from '@nativescript/core'
import { motion, MotionConfig } from '../src/index'
import type { ProbeContext } from '../../../scripts/probe/context'
import { captureDragInput } from './containers-input'
import { geometry } from './containers-geometry'

const input = captureDragInput()
const views: Record<string, NativeView> = {}
const save = (name: string) => (view: NativeView | null) => {
	if (view) {
		views[name] = view
	}
}

let scroller: ScrollableAreaHandle | null = null
let expand = (_value: boolean) => {}
let moveRoot = (_value: boolean) => {}
let shift = (_value: boolean) => {}
let enable = (_value: boolean) => {}
let starts = 0

export default function ContainerProbe() @{
	const [wide, setWide] = useState(false)
	const [rootMoved, setRootMoved] = useState(false)
	const [shifted, setShifted] = useState(false)
	const [enabled, setEnabled] = useState(true)
	expand = setWide
	moveRoot = setRootMoved
	shift = setShifted
	enable = setEnabled

	<MotionConfig reducedMotion="never" transition={{ duration: 0.8, ease: 'linear' }}>
		<View style={{ padding: 10 }}>
			<ScrollableArea
				ref={(value) => {
					scroller = value
				}}
				style={{ width: 320, height: 120 }}
			>
				<View style={{ width: 300, height: 500 }}>
					<motion.View
						layout
						ref={save('paint')}
						style={{
							marginTop: 80,
							width: wide ? 200 : 100,
							height: wide ? 200 : 100,
							borderRadius: 20,
							boxShadow: '0px 4px 12px 0px black',
						}}
					/>
				</View>
			</ScrollableArea>
			<motion.View
				layoutRoot
				ref={save('root')}
				style={{ marginLeft: rootMoved ? 60 : 0, width: 250, height: 60 }}
			>
				<motion.View
					layout="position"
					layoutAnchor={{ x: 1, y: 1 }}
					ref={save('anchored')}
					style={{ marginLeft: rootMoved ? 40 : 20, width: 30, height: 30 }}
				/>
			</motion.View>
			<motion.View
				layout
				ref={save('parent')}
				style={{ marginLeft: shifted ? 100 : 0, width: 250, height: 100 }}
			>
				<motion.View
					layout
					drag={enabled ? 'x' : false}
					dragMomentum={false}
					ref={save('drag')}
					onLayoutAnimationStart={() => {
						starts++
					}}
					style={{ marginLeft: shifted ? 40 : 20, width: 80, height: 60 }}
				/>
			</motion.View>
		</View>
	</MotionConfig>
}

const scalar = (value: any) =>
	typeof value === 'number'
		? value
		: typeof value === 'string'
			? parseFloat(value)
			: Number(value?.value ?? 0)

export async function run(ctx: ProbeContext) {
	ctx.onCleanup(() => input.restore())
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	const close = (name: string, actual: number, expected: number, tolerance = 1.5) => {
		ctx.record(name, { actual, expected })
		ctx.assert(name, Math.abs(actual - expected) <= tolerance, true)
	}

	await ctx.waitFor(() => views.paint?.isLoaded && views.drag?.isLoaded, {
		timeout: 15000,
		interval: 20,
	})

	await sleep(100)
	const paint = () => {
		const box = geometry(views.paint)
		const view = views.paint as any
		const style = view._styleHelper ?? view.style
		const shadow =
			typeof style.boxShadow === 'string' ? parseCSSShadow(style.boxShadow) : style.boxShadow?.[0]

		const scale = box.width / box.modelWidth
		return {
			...box,
			radius: scalar(style.borderRadius ?? style.borderTopLeftRadius) * scale,
			blur: scalar(shadow?.blurRadius) * scale,
		}
	}

	const baseline = paint()
	const view = views.paint as any
	ctx.record('native paint readback', {
		styleRadius: view.style.borderRadius,
		styleCorner: view.style.borderTopLeftRadius,
		styleShadow: view.style.boxShadow,
		viewRadius: view.borderRadius,
		helperRadius: view._styleHelper?.borderRadius,
		helperShadow: view._styleHelper?.boxShadow,
		styleClass: view.style.constructor?.name,
	})

	close('initial width', baseline.width, 100)
	close('authored radius exists', baseline.radius, 20)
	close('authored shadow exists', baseline.blur, 12)
	expand(true)
	await ctx.waitFor(
		() => geometry(views.paint).modelWidth === 200 && Number(views.paint.scaleX) < 0.95,
		{ timeout: 3000, interval: 10 },
	)

	close('initial corrected radius', paint().radius, baseline.radius)
	close('initial corrected shadow', paint().blur, baseline.blur)
	await sleep(180)
	close('intermediate corrected radius', paint().radius, baseline.radius)
	close('intermediate corrected shadow', paint().blur, baseline.blur)
	await ctx.waitFor(() => views.paint.scaleX === 1, { timeout: 3000, interval: 20 })
	close(
		'restored radius',
		scalar(
			(views.paint as any)._styleHelper?.borderRadius ?? views.paint.style.borderTopLeftRadius,
		),
		20,
	)

	scroller!.scrollToOffset({ block: 40 }, { animated: false })
	await sleep(50)
	const childBefore = geometry(views.anchored)
	const rootBefore = geometry(views.root)
	moveRoot(true)
	await ctx.waitFor(() => geometry(views.root).layoutX >= 59, { timeout: 3000, interval: 5 })
	close('root snaps', geometry(views.root).x - rootBefore.x, 60)
	close('child starts relative to new root', geometry(views.anchored).x - childBefore.x, 60, 5)
	close('scroll does not start paint projection', Number(views.paint.scaleX), 1, 0.001)
	await sleep(950)
	close('anchored child settles', geometry(views.anchored).x - childBefore.x, 80)
	input.send(views.drag, 'start', 0)
	input.send(views.drag, 'move', 20)
	await sleep(40)
	const beforeDrag = geometry(views.drag).x
	shift(true)
	await ctx.waitFor(() => geometry(views.parent).layoutX >= 99, { timeout: 3000, interval: 5 })
	await sleep(30)
	close('drag survives layout commit', geometry(views.drag).x, beforeDrag)
	await sleep(180)
	close('drag cancels moving ancestor projection', geometry(views.drag).x, beforeDrag)
	input.send(views.drag, 'move', 30)
	await sleep(40)
	close('drag continues after rebase', geometry(views.drag).x, beforeDrag + 10)
	input.send(views.drag, 'end', 30)
	await sleep(40)
	close('early release does not jump', geometry(views.drag).x, beforeDrag + 10)
	await sleep(850)
	close('ancestor settles without drag drift', geometry(views.drag).x, beforeDrag + 10)
	input.send(views.drag, 'start', 0)
	input.send(views.drag, 'move', 10)
	enable(false)
	await sleep(60)
	const beforeStarts = starts
	shift(false)
	await ctx.waitFor(() => starts > beforeStarts, { timeout: 3000, interval: 10 })
	ctx.assert('disabled drag restores layout animation', starts > beforeStarts, true)
}
