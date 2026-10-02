import {
	Manager,
	HandlerType,
	GestureState,
	GestureHandlerStateEvent,
	GestureHandlerTouchEvent,
} from '@nativescript-community/gesturehandler'

import { Utils } from '@nativescript/core'
import type { PanCallbacks } from './host-types'
import type { DragInfo } from './types'

// Separate tag range from the plugin's built-in gesture observers. Manager
// shares the registry; applications should reserve this range for motion.
let tag = 700000000

export function attachPan(node: any, axis: true | 'x' | 'y', callbacks: PanCallbacks) {
	// 2.0.45 config setters take raw Android pixels (their converter is
	// getter-only); payloads already convert back to DIP.
	const androidHost = Boolean((globalThis as any).android)
	const slop = androidHost ? Utils.layout.toDevicePixels(8) : 8
	const handler = Manager.getInstance().createGestureHandler(HandlerType.PAN, tag++, {
		shouldCancelWhenOutside: false,
		// Android retains its radial touch-slop default alongside activeOffset.
		// Disable that alternative trigger for single-axis arbitration.
		...(androidHost && axis !== true ? { minDist: 1e9 } : {}),
		...(axis === true
			? { minDist: slop }
			: axis === 'x'
				? {
						activeOffsetXStart: -slop,
						activeOffsetXEnd: slop,
						failOffsetYStart: -slop,
						failOffsetYEnd: slop,
					}
				: {
						activeOffsetYStart: -slop,
						activeOffsetYEnd: slop,
						failOffsetXStart: -slop,
						failOffsetXEnd: slop,
					}),
	})

	let active = false
	let last = { x: 0, y: 0 }
	const sample = (args: any, cancelled = false): DragInfo => {
		const extra = args.data.extraData ?? {}
		const offset = { x: extra.translationX ?? last.x, y: extra.translationY ?? last.y }
		const delta = { x: offset.x - last.x, y: offset.y - last.y }
		last = offset
		return {
			point: { x: extra.absoluteX ?? extra.x ?? 0, y: extra.absoluteY ?? extra.y ?? 0 },
			delta,
			offset,
			velocity: { x: extra.velocityX ?? 0, y: extra.velocityY ?? 0 },
			cancelled,
		}
	}

	const state = (args: any) => {
		const next = args.data.state
		if (next === GestureState.ACTIVE && !active) {
			last = { x: 0, y: 0 }
			active = true
			const info = sample(args)
			callbacks.start(args, info)
			callbacks.move(args, info)
		} else if (
			active &&
			[GestureState.END, GestureState.CANCELLED, GestureState.FAILED].includes(next)
		) {
			active = false
			callbacks.end(args, sample(args, next !== GestureState.END))
		}
	}

	const touch = (args: any) => {
		if (active && args.data.state === GestureState.ACTIVE) {
			callbacks.move(args, sample(args))
		}
	}

	handler.on(GestureHandlerStateEvent, state)
	handler.on(GestureHandlerTouchEvent, touch)
	handler.attachToView(node)
	return () => {
		active = false
		handler.off(GestureHandlerStateEvent, state)
		handler.off(GestureHandlerTouchEvent, touch)
		handler.detachFromView(node)
	}
}
