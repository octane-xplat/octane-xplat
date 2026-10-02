/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame'
import { createAnimatedValue } from './animated-value'
import { writeAnimatedProperty, readReducedMotion } from './animation-host.macos'
import type { AnimatedValue } from './props'
export type { AnimatedValue } from './props'

export function useAnimation(initial = 0, property = 'translateX'): AnimatedValue {
	const value = useRef<ReturnType<typeof createAnimatedValue> | null>(null)
	if (!value.current) {
		value.current = createAnimatedValue(initial, {
			now: Date.now,
			request: requestAnimationFrame,
			cancel: cancelAnimationFrame,
			write: (view, next) => writeAnimatedProperty(view, property, next),
			// Match motion's system policy: transforms snap, opacity may fade.
			reducedMotion: () => property !== 'opacity' && readReducedMotion(),
		})
	}

	useEffect(() => () => value.current?.dispose(), [])
	return value.current
}
