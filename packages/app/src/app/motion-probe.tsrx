import { useEffect, useRef, useState } from 'octane'
import {
	MotionConfig,
	Presence,
	motion,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from '@octane-xplat/motion'
import { Screen, Row, Text, Pressable, TextInput, type PanEvent } from '@octane-xplat/ui'
import { goBack } from '../platform/nav'

function PresenceCounter(props: { onMount: () => void; onUnmount: () => void; onFocus: () => void; onBlur: () => void }) @{
	const [count, setCount] = useState(0)
	const [value, setValue] = useState('')

	useEffect(() => {
		props.onMount()
		return () => props.onUnmount()
	}, [])

	<motion.View
		id="motion-presence-card"
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: -10 }}
		transition={{ duration: 0.55 }}
	>
		<Row className="items-center gap-3">
			<Text id="motion-presence-count">{`Retained count: ${count}`}</Text>
			<Pressable id="motion-presence-increment" onPress={() => setCount(count + 1)} className="chip">
				<Text>Increment</Text>
			</Pressable>
		</Row>
		<TextInput
			id="motion-presence-input"
			placeholder="Focus before hiding this card"
			value={value}
			onChange={setValue}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
	</motion.View>
}

function DisposalProbe(props: { onResult: (result: string) => void }) @{
	const x = useMotionValue(0)
	useEffect(() => {
		void x.animate(300, { duration: 8 }).finished.then(props.onResult)
	}, [])

	<motion.View style={{ x }}>
		<Text>Long motion job</Text>
	</motion.View>
}

export function MotionProbe() @{
	const [target, setTarget] = useState(0)
	const [mode, setMode] = useState<'tween' | 'spring'>('tween')
	const [destinationStatus, setDestinationStatus] = useState('waiting for mount animation')
	const [panStatus, setPanStatus] = useState('drag the row horizontally')
	const [present, setPresent] = useState(true)
	const [presenceStatus, setPresenceStatus] = useState('waiting for card mount')
	const [focusStatus, setFocusStatus] = useState('unfocused')
	const [reverseOnNextFocus, setReverseOnNextFocus] = useState(false)
	const [showDisposable, setShowDisposable] = useState(false)
	const [disposalStatus, setDisposalStatus] = useState('not mounted')
	const reduced = useReducedMotion()
	const panX = useMotionValue(0)
	const panScale = useTransform(panX, [-100, 0, 100], [0.9, 1, 0.9])
	const panOrigin = useRef(0)
	const panPhases = useRef<string[]>([])
	const removals = useRef(0)
	const transition = mode === 'spring'
		? { type: 'spring' as const, stiffness: 200, damping: 22 }
		: { duration: 0.9, ease: 'easeOut' as const }

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
			setPanStatus(
				`${event.state}; release vx=${Math.round(velocity)}; phases=${panPhases.current.join('→')}`,
			)
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
		<Screen className="vx-app flex-1 gap-3">
			<Row className="items-center gap-3">
				<Pressable id="motion-probe-back" onPress={() => goBack({ into: 'test' })} className="chip">
					<Text>← Back</Text>
				</Pressable>
				<Text className="text-xl font-semibold">Motion v1 checks</Text>
			</Row>
			<Text id="motion-reduced-state">Reduced motion: {String(reduced)}</Text>

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
			<Text id="motion-destination-status">Destination: {destinationStatus}</Text>
			<motion.View
				id="motion-destination"
				initial={{ opacity: 0.15, x: -24 }}
				animate={{ opacity: 1, x: target }}
				transition={transition}
				onAnimationComplete={() => setDestinationStatus(`completed at ${target}`)}
			>
				<Text>Animated destination</Text>
			</motion.View>

			<Text className="section-label">Pan and motion value</Text>
			<motion.Row id="motion-pan-row" onPan={pan} style={{ x: panX, scale: panScale }} className="items-center justify-center rounded-lg bg-primary p-3">
				<Text className="text-onprimary">Drag me horizontally</Text>
			</motion.Row>
			<Row className="items-center gap-2">
				<Pressable id="motion-value-cancel" onPress={() => {
					const controls = panX.animate(100, { duration: 3 })
					setPanStatus('MotionValue animation started')
					setTimeout(() => controls.stop(), 150)
					void controls.finished.then((result) => setPanStatus(`MotionValue ${result}`))
				}} className="chip">
					<Text>Start/cancel</Text>
				</Pressable>
				<Text id="motion-pan-status">{panStatus}</Text>
			</Row>

			<Text className="section-label">Retained presence</Text>
			<Row className="items-center gap-2">
				<Pressable id="motion-presence-toggle" onPress={() => {
					const next = !present
					setPresent(next)
					setPresenceStatus(next ? 're-entry requested' : 'exit requested')
				}} className="chip">
					<Text>{present ? 'Exit card' : 'Restore card'}</Text>
				</Pressable>
				<Text id="motion-presence-status">{presenceStatus}</Text>
			</Row>
			<Pressable id="motion-presence-arm-focus-reversal" onPress={() => setReverseOnNextFocus(true)} className="chip">
				<Text>Arm focus reversal</Text>
			</Pressable>
				<Text id="motion-presence-focus">Input {focusStatus}</Text>
				<Presence present={present}>
				<PresenceCounter
					onMount={() => setPresenceStatus(`mounted; prior removals=${removals.current}`)}
					onUnmount={() => {
					removals.current += 1
					setPresenceStatus(`unmounted; removals=${removals.current}`)
				}}
					onFocus={() => {
						setFocusStatus('focused')
						if (reverseOnNextFocus) {
							setReverseOnNextFocus(false)
							setPresent(false)
							setPresenceStatus('exit started while focused')
							setTimeout(() => {
								setPresent(true)
								setPresenceStatus('re-entered while focused')
							}, 120)
						}
					}}
					onBlur={() => setFocusStatus('blurred')}
				/>
			</Presence>

			<Text className="section-label">Unmount cancellation</Text>
			<Row className="items-center gap-2">
				<Pressable id="motion-disposal-toggle" onPress={() => {
					setShowDisposable(!showDisposable)
					setDisposalStatus(showDisposable ? 'unmount requested' : 'mount requested')
				}} className="chip">
					<Text>{showDisposable ? 'Unmount job' : 'Mount job'}</Text>
				</Pressable>
				<Text id="motion-disposal-status">{disposalStatus}</Text>
			</Row>
			@if (showDisposable) {
				<DisposalProbe onResult={(result) => setDisposalStatus(`job ${result}`)} />
			}
		</Screen>
	</MotionConfig>
}
