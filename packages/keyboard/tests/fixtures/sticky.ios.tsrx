/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { KeyboardStickyView, KeyboardController } from '../../src/index'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './sticky.css'
let offset = (_value: number) => {},
	enable = (_value: boolean) => {},
	remove = () => {}

export default function StickyProbe() @{
	const [openOffset, setOffset] = useState(8),
		[enabled, setEnabled] = useState(true),
		[show, setShow] = useState(true)

	offset = setOffset
	enable = setEnabled
	remove = () => setShow(false)

	<masonview id="sticky-root" style={{ display: 'grid', gridTemplateRows: '1fr auto' }}>
		<masonview style={{ display: 'flex', flexDirection: 'column', gridRowStart: 1 }}>
			<textfield id="sticky-field" text="Sticky keyboard control" />
		</masonview>
		@if (show) {
			<KeyboardStickyView
				id="sticky-host"
				openOffset={openOffset}
				closedOffset={2}
				enabled={enabled}
				className="sticky-control"
				style={{ gridRowStart: 2 }}
			>
				<label id="sticky-content" text="Composer" />
			</KeyboardStickyView>
		}
	</masonview>
}

export async function run(ctx: ProbeContext) {
	const field = await ctx.waitFor(
		() => ctx.find('sticky-field')?.isLoaded && ctx.find('sticky-field'),
	)

	const root = ctx.find('sticky-root'),
		host = ctx.find('sticky-host')

	ctx.record('initial host', {
		loaded: host?.isLoaded,
		translateY: host?.translateY,
		height: host?.getActualSize?.().height,
	})

	const states: any[] = []
	const off = KeyboardController.onMove(root, (state) => {
		states.push(state)
		ctx.record('latest keyboard', state)
		ctx.record('latest translation', host.translateY)
	})

	ctx.onCleanup(off)
	await ctx.waitFor(() => Math.abs(host.translateY + 2) < 1)
	ctx.assert('sticky wrapper renders its content', !!ctx.find('sticky-content'), true)
	ctx.assert('closed offset moves only sticky host', Math.abs(host.translateY + 2) < 1, true)
	host.scaleX = 1.2
	if (field.android) {
		await ctx.waitFor(() => field.android.hasWindowFocus())
	}

	field.focus()
	await ctx.waitFor(
		() =>
			states.at(-1)?.capabilities.nativeFrames &&
			states.at(-1)?.inset > 100 &&
			Math.abs((states.at(-1)?.currentFrame?.y ?? -1) - (states.at(-1)?.targetFrame?.y ?? -10)) < 1,
	)

	const bottom = () => {
		if (host.ios) {
			const rect = host.ios.convertRectToView(host.ios.bounds, host.ios.window)
			return rect.origin.y + rect.size.height
		}

		const point = (Array as any).create('int', 2),
			origin = (Array as any).create('int', 2)

		host.android.getLocationOnScreen(point)
		host.android.getRootView().getLocationOnScreen(origin)
		return (
			(point[1] - origin[1] + host.android.getHeight()) /
			host.android.getResources().getDisplayMetrics().density
		)
	}

	const top = () => (states.at(-1).currentFrame ?? states.at(-1).targetFrame).y
	ctx.record('open position', { bottom: bottom(), top: top(), translateY: host.translateY })
	await ctx.waitFor(() => Math.abs(bottom() - top() + 8) < 2)
	ctx.assert(
		'open sticky host meets keyboard with requested offset',
		Math.abs(bottom() - top() + 8) < 2,
		true,
	)

	const transition = states.at(-1).transitionId
	offset(20)
	await ctx.waitFor(() => Math.abs(bottom() - top() + 20) < 2)
	ctx.assert(
		'offset changes retain calibrated source',
		states.at(-1).capabilities.nativeFrames && states.at(-1).transitionId === transition,
		true,
	)

	enable(false)
	await ctx.waitFor(() => Math.abs(host.translateY) < 1)
	ctx.assert(
		'disabled sticky restores baseline and retains children',
		host.isLoaded && Math.abs(host.translateY) < 1,
		true,
	)

	ctx.assert('foreign horizontal transform remains', Math.abs(host.scaleX - 1.2) < 0.01, true)
	enable(true)
	await ctx.waitFor(() => Math.abs(bottom() - top() + 20) < 2)
	remove()
	await ctx.waitFor(() => !host.isLoaded)
	ctx.assert('removed sticky releases vertical transform', Math.abs(host.translateY) < 1, true)
	off()
	ctx.assert(
		'last reader releases source state',
		KeyboardController.getSnapshot(root).capabilities.nativeFrames,
		false,
	)
}
