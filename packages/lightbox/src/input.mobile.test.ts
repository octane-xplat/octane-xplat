import { describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript-community/gesturehandler', () => import('../test/gesturehandler'))
vi.mock('@nativescript/core', () => ({ Utils: { layout: { toDevicePixels: (v: number) => v } } }))

import { attachInput } from './input.mobile'
import {
	handlers,
	GestureHandlerStateEvent,
	GestureHandlerTouchEvent,
	GestureState,
} from '../test/gesturehandler'

const node = {}

describe('native input adapter', () => {
	it('emits panStart/panMove/panEnd with velocity and cancel flag', () => {
		const sent: any[] = []
		const off = attachInput(node, { maxZoom: 4 }, (i) => sent.push(i))
		const [pan] = handlers.slice(-4)
		pan.emit(GestureHandlerStateEvent, { state: GestureState.ACTIVE, extraData: { x: 10, y: 20 } })
		pan.emit(GestureHandlerTouchEvent, { state: GestureState.ACTIVE, extraData: { x: 30, y: 40 } })
		pan.emit(GestureHandlerStateEvent, { state: GestureState.END, extraData: { x: 30, y: 40, velocityX: 900, velocityY: 120 } })
		expect(sent).toEqual([
			{ kind: 'panStart', at: { x: 10, y: 20 }, pointer: 'touch' },
			{ kind: 'panMove', at: { x: 30, y: 40 } },
			{ kind: 'panEnd', at: { x: 30, y: 40 }, velocity: { x: 900, y: 120 }, cancelled: false },
		])
		off()
	})

	it('marks cancelled on CANCELLED/FAILED end states', () => {
		const sent: any[] = []
		const off = attachInput(node, { maxZoom: 4 }, (i) => sent.push(i))
		const [pan] = handlers.slice(-4)
		pan.emit(GestureHandlerStateEvent, { state: GestureState.ACTIVE, extraData: { x: 0, y: 0 } })
		pan.emit(GestureHandlerStateEvent, { state: GestureState.CANCELLED, extraData: { x: 5, y: 5, velocityX: 100, velocityY: 0 } })
		expect(sent.at(-1)).toMatchObject({ kind: 'panEnd', cancelled: true })
		off()
	})

	it('emits pinch intents around the focal point', () => {
		const sent: any[] = []
		const off = attachInput(node, { maxZoom: 4 }, (i) => sent.push(i))
		const [, pinch] = handlers.slice(-4)
		pinch.emit(GestureHandlerStateEvent, { state: GestureState.ACTIVE, extraData: { scale: 1, focalX: 100, focalY: 200 } })
		pinch.emit(GestureHandlerTouchEvent, { state: GestureState.ACTIVE, extraData: { scale: 1.5, focalX: 100, focalY: 200 } })
		pinch.emit(GestureHandlerStateEvent, { state: GestureState.END, extraData: { scale: 1.5, focalX: 100, focalY: 200 } })
		expect(sent[0].kind).toBe('pinchStart')
		expect(sent[1].kind).toBe('pinchMove')
		// a/b synthesized symmetric about the focal point; dist grows with scale.
		const d0 = Math.hypot(sent[0].b.x - sent[0].a.x, sent[0].b.y - sent[0].a.y)
		const d1 = Math.hypot(sent[1].b.x - sent[1].a.x, sent[1].b.y - sent[1].a.y)
		expect(d1 / d0).toBeCloseTo(1.5)
		expect(sent[2]).toMatchObject({ kind: 'pinchEnd', cancelled: false })
		off()
	})

	it('single tap waits for the double tap when maxZoom > 1', () => {
		const off = attachInput(node, { maxZoom: 4 }, () => {})
		const [, , tap, double] = handlers.slice(-4)
		expect(tap.options.waitFor).toEqual([double.tag])
		expect(double.options.numberOfTaps).toBe(2)
		off()
	})

	it('single tap does not wait when maxZoom is 1', () => {
		const off = attachInput(node, { maxZoom: 1 }, () => {})
		const [, , tap] = handlers.slice(-4)
		expect(tap.options.waitFor).toBeUndefined()
		off()
	})

	it('emits tap and doubleTap on END', () => {
		const sent: any[] = []
		const off = attachInput(node, { maxZoom: 4 }, (i) => sent.push(i))
		const [, , tap, double] = handlers.slice(-4)
		tap.emit(GestureHandlerStateEvent, { state: GestureState.END, extraData: { x: 5, y: 6 } })
		double.emit(GestureHandlerStateEvent, { state: GestureState.END, extraData: { x: 7, y: 8 } })
		expect(sent).toEqual([
			{ kind: 'tap', at: { x: 5, y: 6 }, pointer: 'touch' },
			{ kind: 'doubleTap', at: { x: 7, y: 8 } },
		])
		off()
	})
})
