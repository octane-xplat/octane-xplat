// Gesture surface for a slide: attaches one gesturehandler graph and forwards
// normalized Intents to the pure machine. Handler events arrive in DIP
// relative to the attached view — the machine's XY space is slide-local.
import {
	Manager,
	HandlerType,
	GestureState,
	GestureHandlerStateEvent,
	GestureHandlerTouchEvent,
} from '@nativescript-community/gesturehandler'

import { Utils } from '@nativescript/core'
import type { Intent } from './gesture-machine'

export interface AttachInputOptions {
	/** `maxZoom > 1` puts the single TAP behind `waitFor` the double TAP. */
	maxZoom: number
}

// Tags live in their own range, distinct from motion's 700000000 block.
let tag = 720000000

const pos = (args: any) => {
	const e = args.data.extraData ?? {}
	return { x: e.x ?? e.absoluteX ?? 0, y: e.y ?? e.absoluteY ?? 0 }
}

// Pinch payloads arrive as { scale, focalX, focalY } (no per-finger points);
// synthesize a/b around the focal point so the machine's dist ratio and
// midpoint both behave correctly.
const touchPoint = (args: any, index: number) => {
	const e = args.data.extraData ?? {}
	const p = e.touches?.[index] ?? e.pointers?.[index]
	if (p) {
		return { x: p.x ?? 0, y: p.y ?? 0 }
	}
	const fx = e.focalX ?? e.x ?? 0
	const fy = e.focalY ?? e.y ?? 0
	const half = ((e.scale ?? 1) * 100) / 2
	return { x: fx + (index === 1 ? half : -half), y: fy }
}

/** Attach PAN + PINCH + TAP×2 to `node`; returns a detach function. */
export function attachInput(node: any, opts: AttachInputOptions, send: (i: Intent) => void) {
	const androidHost = Boolean((globalThis as any).android)
	const slop = androidHost ? Utils.layout.toDevicePixels(6) : 6
	const panTag = tag++
	const pinchTag = tag++
	const tapTag = tag++
	const doubleTag = tag++

	// PAN: raw-delta arbitration stays in the machine; minDist is just the slop
	// gate so the handler activates on real movement.
	const pan = Manager.getInstance().createGestureHandler(HandlerType.PAN, panTag, {
		minDist: slop,
		maxPointers: 1,
		shouldCancelWhenOutside: false,
		simultaneousHandlers: [pinchTag],
	})
	const pinch = Manager.getInstance().createGestureHandler(HandlerType.PINCH, pinchTag, {
		simultaneousHandlers: [panTag],
	})
	const tap = Manager.getInstance().createGestureHandler(HandlerType.TAP, tapTag, {
		numberOfTaps: 1,
		...(opts.maxZoom > 1 ? { waitFor: [doubleTag] } : {}),
	})
	const double = Manager.getInstance().createGestureHandler(HandlerType.TAP, doubleTag, {
		numberOfTaps: 2,
	})

	// --- PAN → panStart/panMove/panEnd -------------------------------------
	let panActive = false
	const panState = (args: any) => {
		const next = args.data.state
		if (next === GestureState.ACTIVE && !panActive) {
			panActive = true
			const p = pos(args)
			send({ kind: 'panStart', at: p, pointer: 'touch' })
		} else if (
			panActive &&
			[GestureState.END, GestureState.CANCELLED, GestureState.FAILED].includes(next)
		) {
			panActive = false
			const e = args.data.extraData ?? {}
			send({
				kind: 'panEnd',
				at: pos(args),
				velocity: { x: e.velocityX ?? 0, y: e.velocityY ?? 0 },
				cancelled: next !== GestureState.END,
			})
		}
	}
	const panTouch = (args: any) => {
		if (panActive && args.data.state === GestureState.ACTIVE) {
			send({ kind: 'panMove', at: pos(args) })
		}
	}

	// --- PINCH → pinchStart/pinchMove/pinchEnd -------------------------------
	let pinchActive = false
	const pinchState = (args: any) => {
		const next = args.data.state
		if (next === GestureState.ACTIVE && !pinchActive) {
			pinchActive = true
			send({ kind: 'pinchStart', a: touchPoint(args, 0), b: touchPoint(args, 1) })
		} else if (
			pinchActive &&
			[GestureState.END, GestureState.CANCELLED, GestureState.FAILED].includes(next)
		) {
			pinchActive = false
			send({ kind: 'pinchEnd', cancelled: next !== GestureState.END })
		}
	}
	const pinchTouch = (args: any) => {
		if (pinchActive && args.data.state === GestureState.ACTIVE) {
			send({ kind: 'pinchMove', a: touchPoint(args, 0), b: touchPoint(args, 1) })
		}
	}

	// --- TAP / double TAP ---------------------------------------------------
	const tapState = (args: any) => {
		if (args.data.state === GestureState.END) {
			send({ kind: 'tap', at: pos(args), pointer: 'touch' })
		}
	}
	const doubleState = (args: any) => {
		if (args.data.state === GestureState.END) {
			send({ kind: 'doubleTap', at: pos(args) })
		}
	}

	pan.on(GestureHandlerStateEvent, panState)
	pan.on(GestureHandlerTouchEvent, panTouch)
	pinch.on(GestureHandlerStateEvent, pinchState)
	pinch.on(GestureHandlerTouchEvent, pinchTouch)
	tap.on(GestureHandlerStateEvent, tapState)
	double.on(GestureHandlerStateEvent, doubleState)

	pan.attachToView(node)
	pinch.attachToView(node)
	tap.attachToView(node)
	double.attachToView(node)

	return (): void => {
		panActive = false
		pinchActive = false
		pan.off(GestureHandlerStateEvent, panState)
		pan.off(GestureHandlerTouchEvent, panTouch)
		pinch.off(GestureHandlerStateEvent, pinchState)
		pinch.off(GestureHandlerTouchEvent, pinchTouch)
		tap.off(GestureHandlerStateEvent, tapState)
		double.off(GestureHandlerStateEvent, doubleState)
		for (const h of [pan, pinch, tap, double]) {
			h.detachFromView(node)
		}
	}
}
