import { describe, expect, it, vi } from 'vitest'
import { attachPan } from './pan'
import {
	handlers,
	GestureHandlerStateEvent,
	GestureHandlerTouchEvent,
	GestureState,
} from '../test/gesturehandler'

describe('native handler drag surface', () => {
	it('configures arbitration, normalizes velocity, and detaches handlers', () => {
		const start = vi.fn(),
			move = vi.fn(),
			end = vi.fn()

		const node = {}
		const off = attachPan(node, 'x', { start, move, end })
		const h = handlers.at(-1)
		expect(h.node).toBe(node)
		expect(h.options).toMatchObject({
			activeOffsetXStart: -8,
			activeOffsetXEnd: 8,
			failOffsetYStart: -8,
			failOffsetYEnd: 8,
		})

		h.emit(GestureHandlerStateEvent, { state: GestureState.BEGAN })
		expect(start).not.toHaveBeenCalled()
		h.emit(GestureHandlerStateEvent, {
			state: GestureState.ACTIVE,
			extraData: { translationX: 10, velocityX: 300 },
		})

		h.emit(GestureHandlerTouchEvent, {
			state: GestureState.ACTIVE,
			extraData: { translationX: 25, velocityX: 400 },
		})

		expect(move.mock.calls.at(-1)?.[1]).toMatchObject({
			offset: { x: 25, y: 0 },
			delta: { x: 15, y: 0 },
			velocity: { x: 400, y: 0 },
		})

		h.emit(GestureHandlerStateEvent, {
			state: GestureState.CANCELLED,
			extraData: { translationX: 25 },
		})

		h.emit(GestureHandlerStateEvent, { state: GestureState.END })
		expect(end).toHaveBeenCalledTimes(1)
		expect(end.mock.calls[0][1].cancelled).toBe(true)
		off()
		expect(h.node).toBeUndefined()
		h.emit(GestureHandlerTouchEvent, { state: GestureState.ACTIVE })
		expect(move).toHaveBeenCalledTimes(2)
	})

	it('uses minDist for both axes and fails perpendicular movement for vertical drag', () => {
		const callbacks = { start() {}, move() {}, end() {} }
		const both = attachPan({}, true, callbacks)
		expect(handlers.at(-1).options.minDist).toBe(8)
		both()
		const vertical = attachPan({}, 'y', callbacks)
		expect(handlers.at(-1).options).toMatchObject({ activeOffsetYEnd: 8, failOffsetXStart: -8 })
		vertical()
		vi.stubGlobal('android', {})
		const density = attachPan({}, true, callbacks)
		expect(handlers.at(-1).options.minDist).toBe(16)
		density()
		const directional = attachPan({}, 'x', callbacks)
		expect(handlers.at(-1).options).toMatchObject({
			minDist: 1e9,
			activeOffsetXEnd: 16,
			failOffsetYEnd: 16,
		})

		directional()
		vi.unstubAllGlobals()
	})
})
