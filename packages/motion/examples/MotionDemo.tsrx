import { useRef, useState } from 'octane'
import { Text, View, Pressable, type PanEvent } from '@octane-xplat/ui'
import { motion, MotionConfig, useMotionValue, useTransform, useReducedMotion } from '../src/index'

/** Mount in a screen to exercise destination changes and pan-to-spring settling. */
export function MotionDemo() @{
	const [expanded, setExpanded] = useState(false)
	const x = useMotionValue(0)
	const scale = useTransform(x, [-120, 0, 120], [0.9, 1, 0.9])
	const origin = useRef(0)
	const reduced = useReducedMotion()
	const pan = (event: PanEvent) => {
		if (event.state === 'began') { x.stop(); origin.current = x.get() }
		if (event.state === 'moved') x.set(Math.max(-120, Math.min(120, origin.current + event.dx)))
		if (event.state === 'ended' || event.state === 'cancelled') {
			x.animate(0, reduced ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 20, velocity: event.state === 'ended' ? event.vx : 0 })
		}
	}

	<MotionConfig reducedMotion="user">
		<View gap={16}>
			<Pressable onPress={() => setExpanded(!expanded)}><Text>Toggle motion</Text></Pressable>
			<motion.View initial={{ opacity: 0 }} animate={{ opacity: 1, x: expanded ? 80 : 0 }} transition={{ duration: 0.25 }}>
				<Text>Animated destination</Text>
			</motion.View>
			<motion.Row onPan={pan} style={{ x, scale }}><Text>Drag, then release</Text></motion.Row>
		</View>
	</MotionConfig>
}
