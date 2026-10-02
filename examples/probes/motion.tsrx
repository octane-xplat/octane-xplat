import { useEffect, useRef, useState } from 'octane'
import {
	MotionConfig,
	Presence,
	motion,
	useMotionValue,
	useReducedMotion,
} from '@octane-xplat/motion'

import { Column, Row, Text, Pressable, TextInput, type PanEvent } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

let frameStamps: number[] = []
let lastStampAt = 0
let tapSamples: number[] = []
const stampNow = () => (globalThis as any).performance?.now?.() ?? Date.now()

function PresenceCounter(props: { onMount: () => void; onUnmount: () => void }) @{
	const [count, setCount] = useState(0)

	useEffect(() => {
		props.onMount()
		return () => props.onUnmount()
	}, [])

	<motion.View
		id="motion-presence-card"
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: -10 }}
		transition={{ duration: 0.3 }}
	>
		<Row className="items-center gap-3">
			<Text id="motion-presence-count">{`Retained count: ${count}`}</Text>
			<Pressable id="motion-presence-increment" onPress={() => setCount(count + 1)} className="chip">
				<Text>Increment</Text>
			</Pressable>
		</Row>
		<TextInput id="motion-presence-input" placeholder="Focus target" />
	</motion.View>
}

function DisposalProbe(props: { onResult: (result: string) => void }) @{
	const x = useMotionValue(0)
	useEffect(() => {
		void x.animate(300, { duration: 8 }).finished.then(props.onResult)
	}, [])

	<motion.View id="motion-disposal-job" style={{ x }}>
		<Text>Long motion job</Text>
	</motion.View>
}

export default function MotionProbe() @{
	const [target, setTarget] = useState(0)
	const [mode, setMode] = useState<'tween' | 'spring'>('tween')
	const [destinationStatus, setDestinationStatus] = useState('waiting for mount animation')
	const [panStatus, setPanStatus] = useState('waiting for pan')
	const [present, setPresent] = useState(true)
	const [presenceStatus, setPresenceStatus] = useState('waiting for card mount')
	const [showDisposable, setShowDisposable] = useState(false)
	const [disposalStatus, setDisposalStatus] = useState('not mounted')
	const reduced = useReducedMotion()
	const panX = useMotionValue(0)
	const pacer = useMotionValue(0)
	useEffect(
		() =>
			pacer.on('change', () => {
				lastStampAt = stampNow()
				frameStamps.push(lastStampAt)
			}),
		[],
	)
	const panOrigin = useRef(0)
	const panPhases = useRef<string[]>([])
	const removals = useRef(0)
	const transition = mode === 'spring'
		? { type: 'spring' as const, stiffness: 200, damping: 22 }
		: { duration: 0.6, ease: 'easeOut' as const }

	const pan = (event: PanEvent) => {
		if (event.state === 'began') {
			panX.stop()
			panOrigin.current = panX.get()
			panPhases.current = ['began']
			setPanStatus('pan began')
		} else if (event.state === 'moved') {
			if (panPhases.current[panPhases.current.length - 1] !== 'moved') {
				panPhases.current.push('moved')
			}

			panX.set(Math.max(-100, Math.min(100, panOrigin.current + event.dx)))
		} else if (event.state === 'ended' || event.state === 'cancelled') {
			panPhases.current.push(event.state)
			const velocity = event.state === 'ended' ? event.vx : 0
			void panX.animate(0, reduced ? { duration: 0 } : {
				type: 'spring', stiffness: 180, damping: 20, velocity,
			}).finished.then((result) => {
				if (result === 'finished') {
					setPanStatus(
						`settled x=${panX.get().toFixed(1)}; phases=${panPhases.current.join('→')}; vx=${Math.round(velocity)}`,
					)
				}
			})
		}
	}

	<MotionConfig reducedMotion="user">
		<Column className="gap-3 p-4">
			<Text id="motion-reduced-state">{`Reduced motion: ${String(reduced)}`}</Text>

			<Row className="gap-2">
				<Pressable id="motion-tween-to" onPress={() => {
					const next = target === 100 ? -100 : 100
					setMode('tween')
					setTarget(next)
					setDestinationStatus(`tween to ${next}`)
				}} className="chip">
					<Text>Tween</Text>
				</Pressable>
				<Pressable id="motion-interrupt-spring" onPress={() => {
					const next = target > 0 ? -40 : 40
					setMode('spring')
					setTarget(next)
					setDestinationStatus(`spring to ${next}`)
				}} className="chip">
					<Text>Interrupt with spring</Text>
				</Pressable>
			</Row>
			<Text id="motion-destination-status">{`Destination: ${destinationStatus}`}</Text>
			<motion.View
				id="motion-destination"
				initial={{ opacity: 0.15, x: -24 }}
				animate={{ opacity: 1, x: target }}
				transition={transition}
				onAnimationComplete={() => setDestinationStatus(`completed at ${target}`)}
			>
				<Text>Animated destination</Text>
			</motion.View>

			<motion.Row id="motion-pan-row" onPan={pan} style={{ x: panX }} className="items-center rounded-lg p-3">
				<Text>Drag target</Text>
			</motion.Row>
			<motion.View
				id="motion-tap-box"
				animate={{ scale: 1 }}
				whileTap={{ scale: 0.6 }}
				transition={{ duration: 0.15, ease: 'linear' }}
				onUpdate={(latest) => { tapSamples.push(latest.scale ?? 1) }}
			>
				<Text>Tap target</Text>
			</motion.View>
			<Row className="items-center gap-2">
				<Pressable id="motion-value-cancel" onPress={() => {
					const controls = panX.animate(100, { duration: 3 })
					setPanStatus('MotionValue animation started')
					setTimeout(() => controls.stop(), 150)
					void controls.finished.then((result) => setPanStatus(`MotionValue ${result}`))
				}} className="chip">
					<Text>Start/cancel</Text>
				</Pressable>
				<Pressable id="motion-pacing-run" onPress={() => {
					frameStamps = []
					pacer.set(0)
					void pacer.animate(100, { type: 'spring', stiffness: 140, damping: 16 })
				}} className="chip">
					<Text>Pace</Text>
				</Pressable>
				<Text id="motion-pan-status">{panStatus}</Text>
			</Row>

			<Row className="items-center gap-2">
				<Pressable id="motion-presence-toggle" onPress={() => {
					const next = !present
					setPresent(next)
					setPresenceStatus(next ? 're-entry requested' : 'exit requested')
				}} className="chip">
					<Text>Toggle card</Text>
				</Pressable>
				<Text id="motion-presence-status">{presenceStatus}</Text>
			</Row>
			<Presence present={present}>
				<PresenceCounter
					onMount={() => setPresenceStatus(`mounted; prior removals=${removals.current}`)}
					onUnmount={() => {
						removals.current += 1
						setPresenceStatus(`unmounted; removals=${removals.current}`)
					}}
				/>
			</Presence>

			<Row className="items-center gap-2">
				<Pressable id="motion-disposal-toggle" onPress={() => {
					setShowDisposable(!showDisposable)
				}} className="chip">
					<Text>Toggle job</Text>
				</Pressable>
				<Text id="motion-disposal-status">{disposalStatus}</Text>
			</Row>
			@if (showDisposable) {
				<DisposalProbe onResult={(result) => setDisposalStatus(`job ${result}`)} />
			}
		</Column>
	</MotionConfig>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('motion-tween-to'))
	ctx.assert(
		'reduced-motion state label',
		ctx.inspect('motion-reduced-state').text.startsWith('Reduced motion:'),
	)

	// Mount animation lands at the resting destination.
	await ctx.waitFor(() => ctx.inspect('motion-destination-status').text.includes('completed at'), {
		timeout: 4000,
	}).catch(() => ctx.record('mount-timeout-status', ctx.inspect('motion-destination-status').text))

	// Tween to a new destination, then interrupt the next run mid-flight with a
	// spring retarget.
	await ctx.press('motion-tween-to')
	ctx.record('after-tween-press', ctx.inspect('motion-destination-status').text)
	await ctx.waitFor(() => ctx.inspect('motion-destination-status').text === 'Destination: completed at 100', {
		timeout: 4000,
	}).catch(() => ctx.record('tween-timeout-status', ctx.inspect('motion-destination-status').text))
	await ctx.press('motion-tween-to')
	await ctx.press('motion-interrupt-spring')
	await ctx.waitFor(() => ctx.inspect('motion-destination-status').text === 'Destination: completed at 40', {
		timeout: 4000,
	}).catch(() => ctx.record('spring-timeout-status', ctx.inspect('motion-destination-status').text))
	ctx.assert(
		'spring retarget destination',
		ctx.inspect('motion-destination-status').text,
		'Destination: completed at 40',
	)

	// Explicit MotionValue cancellation resolves cancelled, never finished.
	await ctx.press('motion-value-cancel')
	await ctx.waitFor(() => ctx.inspect('motion-pan-status').text === 'MotionValue cancelled', {
		timeout: 3000,
	}).catch(() => ctx.record('cancel-timeout-status', ctx.inspect('motion-pan-status').text))

	// Gesture phases: synthetic dispatch — PointerEvents on DOM targets, the
	// native pan gesture observer (GestureTypes.pan = 8) on iOS/Android.
	const panRow = ctx.find('motion-pan-row')
	if (ctx.target === 'web' || ctx.target === 'linux') {
		const fire = (type: string, x: number) =>
			panRow.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: 100, pointerId: 1, bubbles: true }))
		fire('pointerdown', 200)
		fire('pointermove', 240)
		fire('pointermove', 280)
		fire('pointerup', 280)
	} else if (ctx.target === 'ios' || ctx.target === 'android') {
		const observers = panRow.getGestureObservers?.(8) ?? []
		const emit = (state: number, deltaX: number) => {
			for (const observer of observers) {
				observer.callback.call(observer.context, {
					eventName: 'pan',
					object: panRow,
					view: panRow,
					state,
					deltaX,
					deltaY: 0,
					ios: { velocityInView: () => ({ x: 250, y: 0 }) },
				})
			}
		}
		emit(1, 0)
		emit(2, 60)
		emit(3, 80)
	}
	if (ctx.target !== 'macos') {
		await ctx.waitFor(() => ctx.inspect('motion-pan-status').text.startsWith('settled x=0.0'), {
			timeout: 4000,
		})
		ctx.assert(
			'pan phases and settle',
			/began→moved→ended/.test(ctx.inspect('motion-pan-status').text),
		)
	}

	// Presence: retained count through a completed exit is replaced by fresh
	// state on re-entry — increment first, then exit once, then re-enter.
	await ctx.press('motion-presence-increment')
	ctx.assert('presence counter', ctx.inspect('motion-presence-count').text, 'Retained count: 1')
	await ctx.press('motion-presence-toggle')
	await ctx.waitFor(() => ctx.inspect('motion-presence-status').text === 'unmounted; removals=1', {
		timeout: 4000,
	})
	await ctx.press('motion-presence-toggle')
	await ctx.waitFor(() => ctx.inspect('motion-presence-status').text === 'mounted; prior removals=1', {
		timeout: 4000,
	})
	ctx.assert(
		'fresh state after completed exit',
		ctx.inspect('motion-presence-count').text,
		'Retained count: 0',
	)

	// whileTap: pointerdown drives the interaction target, release restores the
	// declarative animate target. Native `touch` is a gesture observer
	// (GestureTypes.touch = 128), not a plain event — dispatch through it.
	const tapBox = ctx.find('motion-tap-box')
	tapSamples = []
	const fireTouch = (action: 'down' | 'up') => {
		if (ctx.target === 'web' || ctx.target === 'linux') {
			tapBox.dispatchEvent(
				new PointerEvent(action === 'down' ? 'pointerdown' : 'pointerup', { pointerId: 1, bubbles: true }),
			)
		} else if (ctx.target === 'ios' || ctx.target === 'android') {
			for (const observer of tapBox.getGestureObservers?.(128) ?? []) {
				observer.callback.call(observer.context, { eventName: 'touch', object: tapBox, action })
			}
		}
	}
	fireTouch('down')
	await ctx.waitFor(() => Math.min(...tapSamples) <= 0.7, { timeout: 3000 })
		.catch(() => ctx.record('tap-engage-samples', tapSamples.slice(0, 10)))
	ctx.assert('whileTap engaged', Math.min(...tapSamples, 1) <= 0.7, true)

	fireTouch('up')
	await ctx.waitFor(() => tapSamples[tapSamples.length - 1] === 1, {
		timeout: 3000,
	}).catch(() => ctx.record('tap-restore-samples', tapSamples.slice(-10)))
	ctx.assert('whileTap restores animate target', tapSamples[tapSamples.length - 1] ?? 0, 1)

	// Delegation evidence: on native targets the declarative tween runs above
	// must have engaged the platform animator; on web the counter stays absent
	// (the web host has no delegate yet).
	const g = globalThis as any
	ctx.record('delegations', JSON.parse(JSON.stringify(g.__xplatMotionDelegations ?? null)))
	if (ctx.target === 'ios' || ctx.target === 'android') {
		ctx.assert('platform delegation engaged', (g.__xplatMotionDelegations?.started ?? 0) >= 1)
	} else {
		ctx.assert('web stays on the JS engine', g.__xplatMotionDelegations === undefined)
	}

	// Frame pacing of the JS engine path: a spring's 'change' stamps are
	// engine frames — report drops (>34ms gaps) as a measurement, not a gate.
	await ctx.press('motion-pacing-run')
	await ctx.waitFor(() => frameStamps.length > 0 && stampNow() - lastStampAt > 250, {
		timeout: 8000,
	})
	const deltas = frameStamps.slice(1).map((t, i) => t - frameStamps[i])
	ctx.record('pacing', {
		frames: frameStamps.length,
		dropped: deltas.filter((d) => d > 34).length,
		maxMs: Math.round(Math.max(0, ...deltas)),
		meanMs: deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0,
	})

	// Unmounting mid-animation cancels the value's job.
	await ctx.press('motion-disposal-toggle')
	await ctx.waitFor(() => ctx.find('motion-disposal-job'), { timeout: 3000 })
	await ctx.press('motion-disposal-toggle')
	await ctx.waitFor(() => ctx.inspect('motion-disposal-status').text === 'job cancelled', {
		timeout: 3000,
	})
}
