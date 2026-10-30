import { useEffect } from 'octane'
import { Icon, View } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'
import { motion, useAnimate, useReducedMotion } from '@octane-xplat/motion'
import { useIntersectionObserver } from '@octane-xplat/intersection-observer'
import { CONSTELLATION_LAYERS, docsIcons } from './icons'

/** Whether the article scrollport still shows the document top; the twinkle
 *  pauses once the reader scrolls away. */
const docAtTop = createStore(true)

// Each leg mirrors half of the original 2.34–4.68s fade cycle.
const leg = () => 1.17 + Math.random() * 1.17

function TwinkleLayer(props: { name: string; twinkling: boolean }) @{
	const [scope, animate] = useAnimate()
	const reduced = useReducedMotion()
	useEffect(() => {
		if (!props.twinkling || reduced) {
			void animate({ opacity: 1 }, { duration: 0.4, ease: 'easeOut' })
			return
		}

		let cancelled = false
		let rest = Math.random() * 3
		void (async () => {
			while (!cancelled) {
				// Single-leg tweens delegate to the platform animator, so JS
				// only runs at leg boundaries; a random rest keeps the layers
				// out of phase.
				const down = await animate(
					{ opacity: 0.35 },
					{ duration: leg(), delay: rest, ease: 'easeInOut' },
				)
				if (cancelled || down !== 'finished') {
					break
				}

				const up = await animate({ opacity: 1 }, { duration: leg(), ease: 'easeInOut' })
				if (cancelled || up !== 'finished') {
					break
				}

				rest = 0.2 + Math.random() * 2
			}
		})()
		return () => {
			cancelled = true
		}
	}, [props.twinkling, reduced])

	<motion.View ref={scope} className="constellation-layer">
		<Icon name={props.name} registry={docsIcons} />
	</motion.View>
}

/** Layered constellation artwork — each polygon subset fades independently
 *  through the shared motion driver, bounded to one run per layer. */
export function ConstellationMark() @{
	const twinkling = useStore(docAtTop)
	<View className="constellation" accessible={false}>
		@for (const layer of CONSTELLATION_LAYERS; key layer.name) {
			<TwinkleLayer name={layer.name} {twinkling} />
		}
	</View>
}

/** First child of the article scroller — publishes whether the scrollport
 *  still shows the document top, pausing the twinkle once it scrolls out. */
export function DocTopSentinel() @{
	const observer = useIntersectionObserver({
		onChange: (entry) => docAtTop.set(entry.isIntersecting),
	})
	<View ref={observer.ref} className="doc-top-sentinel" />
}
