/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import { createAnimatedValue } from './animated-value'
import type { AnimatedValue } from '../../props'
export type { AnimatedValue } from '../../props'

/**
 * Imperative numeric animation through the GTK renderer's style layer.
 * This avoids assigning GTK's read-only width/height properties.
 *
 * @see AnimatedValue, AnimationResult.
 */
export function useAnimation(initial = 0, prop = 'translateX'): AnimatedValue {
	const value = useRef<ReturnType<typeof createAnimatedValue> | null>(null)
	if (!value.current) {
		value.current = createAnimatedValue(initial, {
			now: Date.now,
			request: requestAnimationFrame,
			cancel: cancelAnimationFrame,
			write: (view, next) => {
				view.style[prop] = next
			},
		})
	}

	useEffect(() => () => value.current?.dispose(), [])
	return value.current
}
