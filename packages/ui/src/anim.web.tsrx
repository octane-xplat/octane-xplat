import { useEffect, useRef } from 'octane'
import { writeTransformProp } from './transform.web'
import { createAnimatedValue } from './animated-value'
import type { AnimatedValue } from './props'
export type { AnimatedValue } from './props'

export function useAnimation(initial = 0, prop = 'translateX'): AnimatedValue {
	const value = useRef<ReturnType<typeof createAnimatedValue> | null>(null)
	if (!value.current) {
		value.current = createAnimatedValue(initial, {
			now: Date.now,
			request: requestAnimationFrame,
			cancel: cancelAnimationFrame,
			write: (view, next) => writeTransformProp(view, prop, next),
		})
	}

	useEffect(() => () => value.current?.dispose(), [])
	return value.current
}
