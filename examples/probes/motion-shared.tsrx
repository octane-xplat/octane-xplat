import './intl-shim'
import { useState } from 'octane'
import { View } from '@octane-xplat/ui'
import { motion, LayoutGroup, Presence, MotionConfig } from '@octane-xplat/motion'
import type { ProbeContext } from '../../scripts/probe/context'

const views: Record<string, any> = {}
let select: (value: boolean) => void = () => {}
let reduce: (value: boolean) => void = () => {}

export default function SharedLayoutProbe() @{
	const [next, setNext] = useState(false)
	const [reduced, setReduced] = useState(false)
	select = setNext
	reduce = setReduced

	<MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
		<View style={{ padding: 20 }}>
			<LayoutGroup id="handoff">
				<View style={{ flexDirection: 'row', height: 150 }}>
					<View style={{ width: 140, height: 150 }}>
						<Presence present={!next}>
							<motion.View
								id="shared-old"
								ref={(v: any) => {
									views.old = v
								}}
								layoutId="card"
								transition={{ duration: 0.6, ease: 'linear' }}
								style={{ width: 100, height: 80 }}
							/>
						</Presence>
					</View>
					<View style={{ width: 200, height: 150 }}>
						<Presence present={next}>
							<motion.View
								id="shared-next"
								ref={(v: any) => {
									views.next = v
								}}
								layoutId="card"
								transition={{ duration: 0.6, ease: 'linear' }}
								style={{ width: 180, height: 100 }}
							/>
						</Presence>
					</View>
				</View>
			</LayoutGroup>
			<LayoutGroup id="underline">
				<View style={{ flexDirection: 'row', height: 20 }}>
					<View style={{ width: 140 }}>
						@if (!next) {
							<motion.View
								layoutId="line"
								ref={(v: any) => {
									views.oldLine = v
								}}
								transition={{ duration: 0.6, ease: 'linear' }}
								style={{ width: 60, height: 2 }}
							/>
						}
					</View>
					<View style={{ width: 200 }}>
						@if (next) {
							<motion.View
								layoutId="line"
								ref={(v: any) => {
									views.nextLine = v
								}}
								transition={{ duration: 0.6, ease: 'linear' }}
								style={{ width: 60, height: 2 }}
							/>
						}
					</View>
				</View>
			</LayoutGroup>
			<LayoutGroup id="isolated">
				<motion.View
					ref={(v: any) => {
						views.isolated = v
					}}
					layoutId="card"
					style={{ width: 100, height: 20 }}
				/>
			</LayoutGroup>
		</View>
	</MotionConfig>
}

function geometry(view: any, target: string) {
	const native = view?.nativeViewProtected ?? view?.nativeView
	if (!native) {
		throw new Error('Missing native view')
	}

	if (target === 'ios') {
		const rect = native.convertRectToView(native.bounds, null)
		return { x: Number(rect.origin.x), y: Number(rect.origin.y), width: Number(rect.size.width) }
	}

	const density = native.getResources().getDisplayMetrics().density
	const location = Array.create('int', 2)
	native.getLocationInWindow(location)
	let scale = 1
	for (let current = native; current?.getScaleX; current = current.getParent()) {
		scale *= current.getScaleX()
	}

	return {
		x: location[0] / density,
		y: location[1] / density,
		width: (native.getWidth() * scale) / density,
	}
}

export async function run(ctx: ProbeContext) {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
	await ctx.waitFor(() => views.old?.isLoaded, { timeout: 15000, interval: 20 })
	await sleep(100)
	const before = geometry(views.old, ctx.target)
	const lineBefore = geometry(views.oldLine, ctx.target)
	select(true)
	await ctx.waitFor(() => views.next?.isLoaded && Number(views.next.scaleX) < 0.95, {
		timeout: 2000,
		interval: 10,
	})

	await sleep(170)
	const incoming = geometry(views.next, ctx.target)
	const outgoing = geometry(views.old, ctx.target)
	ctx.record('handoff', {
		before,
		incoming,
		outgoing,
		incomingOpacity: views.next.opacity,
		outgoingOpacity: views.old.opacity,
	})

	ctx.assert('shared members have matching positions', Math.abs(incoming.x - outgoing.x) <= 1, true)
	ctx.assert(
		'shared members have matching sizes',
		Math.abs(incoming.width - outgoing.width) <= 1,
		true,
	)

	ctx.assert('size is interpolating', incoming.width > 105 && incoming.width < 175, true)
	ctx.assert('both members crossfade', views.next.opacity > 0 && views.old.opacity > 0, true)
	ctx.assert('other group does not move', views.isolated.translateX, 0)
	ctx.assert('other group does not scale', views.isolated.scaleX, 1)
	const lineMid = geometry(views.nextLine, ctx.target)
	ctx.assert(
		'unmounted underline source hands off',
		lineMid.x > lineBefore.x + 5 && lineMid.x < lineBefore.x + 135,
		true,
	)

	ctx.assert('underline retains its size', Math.abs(lineMid.width - 60) <= 1, true)
	select(false)
	await sleep(35)
	const reversed = geometry(views.old, ctx.target)
	ctx.assert('reversal stays near presented position', Math.abs(reversed.x - incoming.x) < 20, true)
	await sleep(850)
	ctx.assert('retained destination removed', views.next == null, true)
	const settled = geometry(views.old, ctx.target)
	ctx.assert('source returns to initial position', Math.abs(settled.x - before.x) <= 1, true)
	ctx.assert('source restores width', Math.abs(settled.width - 100) <= 1, true)
	ctx.assert('source restores opacity', views.old.opacity, 1)
	ctx.assert(
		'underline reverses to its initial position',
		Math.abs(geometry(views.oldLine, ctx.target).x - lineBefore.x) <= 1,
		true,
	)

	ctx.record('settled', settled)
	reduce(true)
	select(true)
	await ctx.waitFor(() => views.next?.isLoaded && views.old == null, {
		timeout: 2000,
		interval: 10,
	})

	ctx.assert('reduced handoff has no translation', views.next.translateX, 0)
	ctx.assert('reduced handoff has no scale', views.next.scaleX, 1)
	ctx.assert('reduced handoff restores opacity', views.next.opacity, 1)
	ctx.assert(
		'reduced handoff settles to destination width',
		Math.abs(geometry(views.next, ctx.target).width - 180) <= 1,
		true,
	)
}
